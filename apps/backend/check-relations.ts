import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'rajesh.sharma@example.com' },
    include: {
      parent_relations: {
        include: { student: true }
      }
    }
  });

  console.log("Parent User:", user?.email, "ID:", user?.id);
  console.log("Relations:", JSON.stringify(user?.parent_relations, null, 2));
}

main().finally(() => prisma.$disconnect());
