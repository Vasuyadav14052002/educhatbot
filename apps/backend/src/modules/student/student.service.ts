import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto, LinkParentDto, PromoteStudentDto } from './dto/student.dto';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(dto: CreateStudentDto, schoolId: string) {
    // Check uniqueness within school
    const existing = await this.prisma.student.findFirst({
      where: {
        school_id: schoolId,
        OR: [{ student_code: dto.student_code }, { admission_no: dto.admission_no }],
      },
    });
    if (existing) {
      throw new ConflictException('Student code or admission number already exists in this school');
    }

    const student = await this.prisma.student.create({
      data: { ...dto, school_id: schoolId },
      include: { class: { select: { id: true, name: true, section: true } } },
    });

    await this.prisma.auditLog.create({
      data: { school_id: schoolId, action: 'CREATE', entity_type: 'Student', entity_id: student.id, new_value: student as object },
    });

    return student;
  }

  async findAll(schoolId: string, query: StudentQueryDto) {
    const { page = 1, limit = 20, search, class_id, status, sort_by = 'first_name', sort_order = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      school_id: schoolId,
      ...(status ? { status: status as StudentStatus } : { status: StudentStatus.ACTIVE }),
      ...(class_id && { class_id }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' as const } },
          { last_name: { contains: search, mode: 'insensitive' as const } },
          { student_code: { contains: search, mode: 'insensitive' as const } },
          { admission_no: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
        include: {
          class: { select: { id: true, name: true, section: true } },
          parent_relations: {
            include: { parent: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } } },
            take: 2,
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students.map((s) => ({ ...s, full_name: `${s.first_name} ${s.last_name}` })),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  async findOne(id: string, schoolId: string) {
    const cacheKey = this.redisService.studentKey(schoolId, id);
    const cached = await this.redisService.getJson<object>(cacheKey);
    if (cached) return cached;

    const student = await this.prisma.student.findFirst({
      where: { id, school_id: schoolId },
      include: {
        class: true,
        parent_relations: {
          include: {
            parent: { select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true } },
          },
        },
        achievements: { orderBy: { date: 'desc' } },
        badges: { orderBy: { awarded_date: 'desc' } },
        teacher_remarks: {
          include: { teacher: { select: { first_name: true, last_name: true } } },
          orderBy: { created_at: 'desc' },
        },
        cultural_activities: { orderBy: { event_date: 'desc' } },
        fees: { orderBy: { due_date: 'asc' } },
        homework_submissions: {
          include: { homework: { include: { subject: true } } },
          orderBy: { created_at: 'desc' },
        },
        sports_records: { orderBy: { participation_date: 'desc' } },
        student_leaderships: { orderBy: { start_date: 'desc' } },
        club_memberships: true,
        media_files: { orderBy: { created_at: 'desc' } },
        attendance: { orderBy: { date: 'desc' } },
        progress: { include: { subject: true }, orderBy: { date: 'desc' } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const result = { ...student, full_name: `${student.first_name} ${student.last_name}` };
    await this.redisService.setJson(cacheKey, result, 1800);
    return result;
  }

  async update(id: string, dto: UpdateStudentDto, schoolId: string) {
    const student = await this.findOne(id, schoolId);
    const oldValue = student;

    const updated = await this.prisma.student.update({
      where: { id },
      data: dto,
      include: { class: { select: { id: true, name: true, section: true } } },
    });

    await this.redisService.invalidateStudentCache(schoolId, id);

    await this.prisma.auditLog.create({
      data: {
        school_id: schoolId,
        action: 'UPDATE',
        entity_type: 'Student',
        entity_id: id,
        old_value: oldValue as object,
        new_value: updated as object,
      },
    });

    return updated;
  }

  async linkParent(studentId: string, dto: LinkParentDto, schoolId: string) {
    const student = await this.findOne(studentId, schoolId);
    const parent = await this.prisma.user.findFirst({
      where: { id: dto.parent_user_id, school_id: schoolId, role: 'PARENT' },
    });

    if (!parent) throw new NotFoundException('Parent user not found');

    const relation = await this.prisma.parentStudentRelation.upsert({
      where: {
        parent_user_id_student_id: {
          parent_user_id: dto.parent_user_id,
          student_id: studentId,
        },
      },
      update: {
        relationship: dto.relationship,
        is_primary: dto.is_primary,
        verified_at: new Date(),
      },
      create: {
        parent_user_id: dto.parent_user_id,
        student_id: studentId,
        relationship: dto.relationship,
        is_primary: dto.is_primary ?? false,
        verified_at: new Date(),
      },
    });

    await this.redisService.invalidateStudentCache(schoolId, studentId);
    return relation;
  }

  async promoteStudent(studentId: string, dto: PromoteStudentDto, schoolId: string, promotedBy: string) {
    const student = await this.findOne(studentId, schoolId);

    await this.prisma.$transaction([
      this.prisma.student.update({
        where: { id: studentId },
        data: {
          class_id: dto.to_class_id,
          status: dto.action === 'ARCHIVED' ? 'ARCHIVED' : dto.action === 'GRADUATED' ? 'GRADUATED' : dto.action === 'TRANSFERRED' ? 'TRANSFERRED' : 'ACTIVE',
        },
      }),
      this.prisma.studentPromotion.create({
        data: {
          student_id: studentId,
          from_class_id: (student as { class_id: string }).class_id,
          to_class_id: dto.to_class_id,
          academic_year_id: dto.academic_year_id,
          action: dto.action,
          reason: dto.reason,
          promoted_by: promotedBy,
        },
      }),
    ]);

    await this.redisService.invalidateStudentCache(schoolId, studentId);
    this.logger.log(`Student ${studentId} ${dto.action} to class ${dto.to_class_id} by ${promotedBy}`);
    return { success: true, action: dto.action };
  }
}
