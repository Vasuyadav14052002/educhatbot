const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmqhrhk030000z6bswepeysd9'; // From DB

  const [totalStudents, lastMonthStudents] = await Promise.all([
    prisma.student.count({
      where: { school_id: schoolId, status: 'ACTIVE' },
    }),
    prisma.student.count({
      where: {
        school_id: schoolId,
        status: 'ACTIVE',
        joined_date: {
          lt: new Date(new Date().setDate(1)), // before this month
        },
      },
    }),
  ]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayObj = new Date(todayStr);
  const attendanceRecords = await prisma.attendance.findMany({
    where: { school_id: schoolId, date: todayObj },
  });

  console.log('totalStudents:', totalStudents, 'attendanceRecords:', attendanceRecords.length);

  const totalTeachers = await prisma.user.count({
    where: { school_id: schoolId, role: 'TEACHER', status: 'ACTIVE' },
  });
  console.log('totalTeachers:', totalTeachers);

  const currentMonthStart = new Date(new Date().setDate(1));
  const feesThisMonth = await prisma.fee.findMany({
    where: { school_id: schoolId, due_date: { gte: currentMonthStart } },
  });
  console.log('feesThisMonth:', feesThisMonth.length);
}

main().finally(() => prisma.$disconnect());
