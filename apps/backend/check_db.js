const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.student.count();
  const a = await prisma.student.count({where: {status: 'ACTIVE'}});
  const u = await prisma.user.findMany();
  console.log('Students:', s, 'Active:', a, 'User1 school_id:', u[0]?.school_id, 'User1 status:', u[0]?.status, 'Role:', u[0]?.role);

  const att = await prisma.attendance.count();
  console.log('Total Attendance records:', att);
}

main().finally(() => prisma.$disconnect());
