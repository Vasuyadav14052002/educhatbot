const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const years = await prisma.academicYear.findMany({ where: { is_active: true } });
  console.log('Active Years:', years.map(y => y.id));
}

main().finally(() => prisma.$disconnect());
