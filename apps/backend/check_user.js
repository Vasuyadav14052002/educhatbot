const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { first_name: 'Ramesh' },
  });
  console.log('Ramesh User:', users);

  const school = await prisma.school.findFirst();
  console.log('First School:', school);

  const students = await prisma.student.count({
    where: { school_id: school.id, status: 'ACTIVE' },
  });
  console.log('Students in First School:', students);
}

main().finally(() => prisma.$disconnect());
