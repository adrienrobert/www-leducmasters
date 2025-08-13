// Test direct du service
import { TournamentService } from './src/lib/services/tournament.service.js';

async function testDirectService() {
  try {
    console.log('🚀 Test direct du service de création de tournoi...');
    
    const tournament = await TournamentService.createTournament({
      title: 'Test Direct Tournament',
      location: 'Test Location',
      date: new Date('2025-08-13'),
      playerIds: [
        'cme9q3zea0006ygrqfw4mknba', // Adrien
        'cme9q3ze90005ygrqi8n72z9u', // Agathe
        'cme9r9gru0009yg2ompoacfzn', // Ambre
        'cme9q3ze80003ygrq5p6s7oty'  // Arthur
      ]
    });
    
    console.log('✅ Tournoi créé avec succès !');
    console.log('ID:', tournament.id);
    console.log('Titre:', tournament.title);
    console.log('Joueurs:', tournament.players.length);
    console.log('Matchs:', tournament.matches.length);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

testDirectService();
