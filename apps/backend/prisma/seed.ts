import {
  PrismaClient,
  UserRole,
  Gender,
  StudentStatus,
  AttendanceStatus,
  SubscriptionPlan,
  SchoolStatus,
  HomeworkStatus,
  EngagementLevel,
  AcademicYearStatus,
  PromotionAction,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Academic Years redesign...');

  // ─── Clean Old Records ────────────────────────────────────────────────────────
  console.log('🧹 Cleaning old database records...');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.homeworkSubmission.deleteMany({});
  await prisma.homework.deleteMany({});
  await prisma.teacherRemark.deleteMany({});
  await prisma.clubMembership.deleteMany({});
  await prisma.studentLeadership.deleteMany({});
  await prisma.sportsRecord.deleteMany({});
  await prisma.participation.deleteMany({});
  await prisma.culturalActivity.deleteMany({});
  await prisma.studentRanking.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.parentStudentRelation.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.mark.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.studentPromotion.deleteMany({});
  await prisma.studentProgress.deleteMany({});
  await prisma.mediaFile.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.subjectTopic.deleteMany({});
  await prisma.subjectSyllabus.deleteMany({});
  await prisma.subjectResource.deleteMany({});
  await prisma.teacherActivity.deleteMany({});
  
  await prisma.teacherSkill.deleteMany({});
  await prisma.teacherAward.deleteMany({});
  await prisma.teacherLeaveRecord.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.classSubject.deleteMany({});
  await prisma.teacherSubject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.term.deleteMany({});
  await prisma.academicYear.deleteMany({});
  await prisma.user.deleteMany({});

  // ─── School ──────────────────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { code: 'EDTK001' },
    update: {},
    create: {
      name: 'EduTrack Academy',
      code: 'EDTK001',
      email: 'admin@edutrack.school',
      phone: '+91-9876543210',
      address: '123 Education Lane, Knowledge Park, Mumbai - 400001',
      subscription_plan: SubscriptionPlan.PROFESSIONAL,
      status: SchoolStatus.ACTIVE,
    },
  });
  console.log(`✅ School: ${school.name}`);

  // ─── Academic Years ───────────────────────────────────────────────────────────
  console.log('📅 Seeding Academic Years...');
  
  const ay2022 = await prisma.academicYear.create({
    data: {
      school_id: school.id,
      name: '2022-2023',
      start_date: new Date('2022-06-01'),
      end_date: new Date('2023-04-30'),
      is_current: false,
      status: AcademicYearStatus.ARCHIVED,
      terms: {
        create: [
          { name: 'Term 1', start_date: new Date('2022-06-01'), end_date: new Date('2022-10-15') },
          { name: 'Term 2', start_date: new Date('2022-11-01'), end_date: new Date('2023-04-30') },
        ]
      }
    },
  });

  const ay2023 = await prisma.academicYear.create({
    data: {
      school_id: school.id,
      name: '2023-2024',
      start_date: new Date('2023-06-01'),
      end_date: new Date('2024-04-30'),
      is_current: false,
      status: AcademicYearStatus.ARCHIVED,
      terms: {
        create: [
          { name: 'Term 1', start_date: new Date('2023-06-01'), end_date: new Date('2023-10-15') },
          { name: 'Term 2', start_date: new Date('2023-11-01'), end_date: new Date('2024-04-30') },
        ]
      }
    },
  });

  const ay2024 = await prisma.academicYear.create({
    data: {
      school_id: school.id,
      name: '2024-2025',
      start_date: new Date('2024-06-01'),
      end_date: new Date('2025-04-30'),
      is_current: true,
      status: AcademicYearStatus.ACTIVE,
      terms: {
        create: [
          { name: 'Term 1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-15'), is_current: true },
          { name: 'Term 2', start_date: new Date('2024-11-01'), end_date: new Date('2025-04-30') },
        ]
      }
    },
    include: { terms: true }
  });
  
  const ay2025 = await prisma.academicYear.create({
    data: {
      school_id: school.id,
      name: '2025-2026',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2026-04-30'),
      is_current: false,
      status: AcademicYearStatus.UPCOMING,
      terms: {
        create: [
          { name: 'Term 1', start_date: new Date('2025-06-01'), end_date: new Date('2025-10-15') },
          { name: 'Term 2', start_date: new Date('2025-11-01'), end_date: new Date('2026-04-30') },
        ]
      }
    },
  });

  const term1 = ay2024.terms.find(t => t.name === 'Term 1')!;

  // ─── Password Hashes ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123', 12);
  const parentPasswordHash = await bcrypt.hash('Parent@123', 12);
  const studentUserPassword = await bcrypt.hash('Parent@123', 12);

  // ─── Users ───────────────────────────────────────────────────────────────────
  const schoolAdmin = await prisma.user.create({
    data: { email: 'admin@edutrack.school', password_hash: passwordHash, first_name: 'Ramesh', last_name: 'Kumar', role: UserRole.SCHOOL_ADMIN, school_id: school.id },
  });

  const teacher1 = await prisma.user.create({ data: { email: 'teacher1@edutrack.school', password_hash: teacherPasswordHash, first_name: 'Priya', last_name: 'Sharma', role: UserRole.TEACHER, school_id: school.id } });
  const teacher2 = await prisma.user.create({ data: { email: 'teacher2@edutrack.school', password_hash: teacherPasswordHash, first_name: 'Amit', last_name: 'Verma', role: UserRole.TEACHER, school_id: school.id } });
  const teacher3 = await prisma.user.create({ data: { email: 'teacher3@edutrack.school', password_hash: teacherPasswordHash, first_name: 'Sunita', last_name: 'Reddy', role: UserRole.TEACHER, school_id: school.id } });
  const teacher4 = await prisma.user.create({ data: { email: 'teacher4@edutrack.school', password_hash: teacherPasswordHash, first_name: 'Ramesh', last_name: 'Nair', role: UserRole.TEACHER, school_id: school.id } });

  // --- Seed Teacher Profiles & Extended Info ---
  const teachersArr = [teacher1, teacher2, teacher3, teacher4];
  for (let i = 0; i < teachersArr.length; i++) {
    const t = teachersArr[i];
    
    await prisma.teacherProfile.create({
      data: {
        teacher_id: t.id,
        bio: `Experienced educator with a passion for holistic learning. Specialized in modern teaching methodologies.`,
        qualification: i % 2 === 0 ? 'M.Sc., B.Ed.' : 'M.A., M.Ed.',
        experience_years: 5 + i * 2,
        joined_date: new Date(`${2018 + i}-05-15`),
        photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.first_name}${t.last_name}`,
      }
    });

    await prisma.teacherSkill.createMany({
      data: [
        { teacher_id: t.id, skill_name: 'Classroom Management', category: 'pedagogical', proficiency_level: 'expert' },
        { teacher_id: t.id, skill_name: 'Curriculum Design', category: 'pedagogical', proficiency_level: 'intermediate' },
        { teacher_id: t.id, skill_name: 'Digital Whiteboards', category: 'technical', proficiency_level: 'expert' },
      ]
    });

    await prisma.teacherAward.create({
      data: {
        teacher_id: t.id,
        title: i === 0 ? 'Best Teacher Award 2023' : 'Excellence in Teaching',
        description: 'Awarded for outstanding contribution to student development.',
        awarded_by: 'State Education Board',
        awarded_date: new Date(`2023-09-05`),
        academic_year: '2023-2024'
      }
    });

    await prisma.teacherLeaveRecord.create({
      data: {
        teacher_id: t.id,
        leave_type: 'casual',
        start_date: new Date('2024-08-10'),
        end_date: new Date('2024-08-12'),
        status: 'approved',
        academic_year: '2024-2025',
        term: 'term1'
      }
    });
  }

  const parent1 = await prisma.user.create({ data: { email: 'parent1@example.com', password_hash: parentPasswordHash, first_name: 'Rajesh', last_name: 'Gupta', role: UserRole.PARENT, school_id: school.id } });

  // ─── EXACTLY 12 Classes ────────────────────────────────────────────────────────
  const createdClasses: any[] = [];
  for (let i = 1; i <= 12; i++) {
    const cls = await prisma.class.create({ data: { school_id: school.id, name: `Class ${i}`, section: 'A', capacity: 30 } });
    createdClasses.push(cls);
  }
  const class1 = createdClasses[0];
  const class2 = createdClasses[1];
  
  console.log('✅ Classes created: Class 1 to Class 12');

  // ─── Subjects ────────────────────────────────────────────────────────────────
  const subjectData = [
    { name: 'Mathematics', code: 'MATH', color: '#4F46E5' },
    { name: 'Science', code: 'SCI', color: '#10B981' },
    { name: 'English Language', code: 'ENG', color: '#F59E0B' },
  ];

  const subjects = await Promise.all(subjectData.map(s => prisma.subject.create({ data: { ...s, school_id: school.id } })));
  
  for (const c of createdClasses) {
    await prisma.classSubject.createMany({
      data: [
        { class_id: c.id, subject_id: subjects[0].id, teacher_id: teacher1.id },
        { class_id: c.id, subject_id: subjects[1].id, teacher_id: teacher2.id },
        { class_id: c.id, subject_id: subjects[2].id, teacher_id: teacher3.id },
      ]
    });
  }

  // ─── EXACTLY 4 Students per Class (Total 48 Students) ─────────────────────
  const students: any[] = [];
  const indianNames = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Karan', 'Aditi', 'Kabir', 'Sneha', 'Vikram', 'Rahul', 'Amit', 'Pooja', 'Sanjay', 'Divya', 'Arjun', 'Shruti'];
  let studentCounter = 1;

  for (const c of createdClasses) {
    for (let i = 1; i <= 4; i++) {
      const firstName = indianNames[(studentCounter - 1) % indianNames.length];
      const lastName = `Student${studentCounter}`;

      const user = await prisma.user.create({
        data: {
          email: `${firstName.toLowerCase()}${studentCounter}@edutrack.school`,
          password_hash: studentUserPassword,
          first_name: firstName,
          last_name: lastName,
          role: UserRole.STUDENT,
          school_id: school.id,
        },
      });

      const student = await prisma.student.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          student_code: `STU${studentCounter.toString().padStart(3, '0')}`,
          admission_no: `ADM${24000 + studentCounter}`,
          dob: new Date('2015-08-15'),
          gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
          school_id: school.id,
          class_id: c.id,
          user_id: user.id,
          status: StudentStatus.ACTIVE,
          joined_date: new Date('2023-06-01'),
          photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${studentCounter}`,
        },
      });
      students.push(student);
      studentCounter++;
    }
  }
  console.log(`✅ Students created: exactly 48 students`);

  // Link Parent
  await prisma.parentStudentRelation.create({
    data: { parent_user_id: parent1.id, student_id: students[0].id, relationship: 'FATHER', is_primary: true, verified_at: new Date() },
  });

  // ─── Academic Events ────────────────────────────────────────────────────────
  await prisma.event.createMany({
    data: [
      { school_id: school.id, academic_year_id: ay2023.id, title: 'Annual Sports Day 2023', event_date: new Date('2023-12-15'), is_published: true, created_by: schoolAdmin.id },
      { school_id: school.id, academic_year_id: ay2023.id, title: 'Science Exhibition', event_date: new Date('2024-02-20'), is_published: true, created_by: schoolAdmin.id },
      { school_id: school.id, academic_year_id: ay2024.id, title: 'School Reopening Day', event_date: new Date('2024-06-05'), is_published: true, created_by: schoolAdmin.id },
      { school_id: school.id, academic_year_id: ay2024.id, title: 'Mid-Term Examinations', event_date: new Date('2024-10-01'), is_published: true, created_by: schoolAdmin.id },
      { school_id: school.id, academic_year_id: ay2024.id, title: 'Winter Carnival', event_date: new Date('2024-12-20'), is_published: true, created_by: schoolAdmin.id },
      { school_id: school.id, academic_year_id: ay2024.id, title: 'Annual Day Celebration', event_date: new Date('2025-01-15'), is_published: true, created_by: schoolAdmin.id },
    ]
  });

  // ─── Achievements ───────────────────────────────────────────────────────────
  await prisma.achievement.create({
    data: {
      school_id: school.id,
      student_id: students[0].id,
      academic_year_id: ay2023.id,
      title: 'National Math Olympiad Gold',
      description: 'Secured 1st rank nationally in the Junior Math Olympiad.',
      date: new Date('2023-11-10'),
      level: 'National',
    },
  });

  await prisma.achievement.create({
    data: {
      school_id: school.id,
      student_id: students[4].id,
      academic_year_id: ay2024.id,
      title: 'State Level Spelling Bee Winner',
      description: 'Won the regional spelling bee contest.',
      date: new Date('2024-08-20'),
      level: 'State',
    },
  });

  // ─── Historical Promotions (For 2023-2024 to 2024-2025) ──────────────────────
  console.log('📅 Seeding Student Promotions...');
  for (const s of students) {
    if (s.class_id === class2.id) {
      // Meaning they were in Class 1 in 2023-2024, promoted to Class 2
      await prisma.studentPromotion.create({
        data: {
          student_id: s.id,
          from_class_id: class1.id,
          to_class_id: class2.id,
          academic_year_id: ay2023.id,
          action: PromotionAction.PROMOTED,
          promoted_by: schoolAdmin.id,
          promoted_at: new Date('2024-04-15')
        }
      });
    }
  }

  // ─── Attendance & Marks ───────────────────────────────────────────────────────
  console.log('📅 Seeding Minimal Attendance & Marks...');
  for (const s of students) {
    await prisma.attendance.create({
      data: {
        school_id: school.id,
        student_id: s.id,
        academic_year_id: ay2024.id,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
        marked_by: teacher1.id,
      }
    });

    const exam = await prisma.exam.create({
      data: { school_id: school.id, class_id: s.class_id, academic_year_id: ay2024.id, term_id: term1.id, name: 'Unit Test 1', exam_type: 'UNIT_TEST', start_date: new Date('2024-08-01'), end_date: new Date('2024-08-05') }
    });

    await prisma.mark.create({
      data: {
        school_id: school.id, student_id: s.id, exam_id: exam.id, subject_id: subjects[0].id,
        academic_year_id: ay2024.id, term_id: term1.id, score: 85, max_score: 100, percentage: 85,
        entered_by: teacher1.id
      }
    });
  }

  // ─── Subject Hub Data (Syllabus, Topics, Resources, Activities) ─────────────
  console.log('📚 Seeding Subject Hub details...');
  for (const subject of subjects) {
    await prisma.subjectResource.createMany({
      data: [
        { school_id: school.id, subject_id: subject.id, title: 'Chapter 1 Notes', type: 'PDF', url: 'https://example.com/notes.pdf', uploaded_by: teacher1.id },
        { school_id: school.id, subject_id: subject.id, title: 'Introduction Presentation', type: 'Presentation', url: 'https://example.com/presentation.pptx', uploaded_by: teacher2.id },
      ]
    });

    const unit1 = await prisma.subjectSyllabus.create({
      data: { school_id: school.id, subject_id: subject.id, unit_name: 'Unit 1: Fundamentals', description: 'Core principles and basic concepts.', order_index: 1 }
    });
    const unit2 = await prisma.subjectSyllabus.create({
      data: { school_id: school.id, subject_id: subject.id, unit_name: 'Unit 2: Advanced Topics', description: 'Deep dive into complex areas.', order_index: 2 }
    });

    for (const cls of createdClasses) {
      await prisma.subjectTopic.createMany({
        data: [
          { syllabus_id: unit1.id, topic_name: 'Introduction', class_id: cls.id, teacher_id: teacher1.id, status: 'Completed', progress: 100, completion_date: new Date('2024-07-15') },
          { syllabus_id: unit1.id, topic_name: 'Core Concepts', class_id: cls.id, teacher_id: teacher1.id, status: 'In Progress', progress: 60 },
          { syllabus_id: unit2.id, topic_name: 'Analysis Methods', class_id: cls.id, teacher_id: teacher2.id, status: 'Pending', progress: 0 },
        ]
      });
    }

    await prisma.teacherActivity.createMany({
      data: [
        { school_id: school.id, subject_id: subject.id, teacher_id: teacher1.id, action: 'Uploaded Resource', detail: 'Chapter 1 Notes added' },
        { school_id: school.id, subject_id: subject.id, teacher_id: teacher2.id, action: 'Updated Syllabus', detail: 'Marked "Introduction" as Completed' },
      ]
    });
  }

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
