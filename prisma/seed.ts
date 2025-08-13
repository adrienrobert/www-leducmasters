import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Créer les 8 joueurs par défaut
  const defaultPlayers = [
    'Cécile',
    'Benoit', 
    'Nanou',
    'Arthur',
    'Quentin',
    'Agathe',
    'Adrien',
    'Mathis',
    'Gabin',
    'Ambre'
  ];

  console.log('🌱 Seeding database...');

  for (const name of defaultPlayers) {
    const player = await prisma.player.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    console.log(`✅ Created player: ${player.name}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
