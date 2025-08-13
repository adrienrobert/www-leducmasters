// Script de test pour la création de tournoi
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTournament() {
  try {
    // Récupérer les joueurs
    console.log('🔍 Récupération des joueurs...');
    const players = await prisma.player.findMany({
      take: 4,
      orderBy: { name: 'asc' }
    });
    
    console.log('Joueurs trouvés:', players.map(p => ({ id: p.id, name: p.name })));
    
    if (players.length < 4) {
      console.error('❌ Pas assez de joueurs en base');
      return;
    }
    
    // Tester l'API de création
    console.log('\n🚀 Test de création de tournoi...');
    const response = await fetch('http://localhost:5173/api/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Script Tournament',
        location: 'Test Location',
        date: '2025-08-13',
        playerIds: players.map(p => p.id)
      })
    });
    
    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Résultat:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTournament();
