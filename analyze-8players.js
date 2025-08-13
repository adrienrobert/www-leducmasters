import { BracketEngine } from './src/lib/bracket/engine.js';

// Analyse détaillée pour 8 joueurs
function analyzeFor8Players() {
  console.log('🔍 Analyse détaillée pour 8 joueurs\n');

  const players = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1
  }));

  const tournamentId = 'test-8';
  
  const mainMatches = BracketEngine.generateMainBracket(players, tournamentId);
  const loserMatches = BracketEngine.generateLoserBracket(8, tournamentId);
  const finalMatches = BracketEngine.generateFinalMatches(tournamentId, 8);
  
  console.log('📊 Main bracket:');
  mainMatches.forEach(m => {
    console.log(`  ${m.id} - Round ${m.roundNumber}, Slot ${m.slotInRound}`);
  });
  
  console.log('\n📊 Loser bracket:');
  loserMatches.forEach(m => {
    console.log(`  ${m.id} - Round ${m.roundNumber}, Slot ${m.slotInRound}`);
  });
  
  console.log('\n📊 Final matches:');
  finalMatches.forEach(m => {
    console.log(`  ${m.id} - Bracket ${m.bracket}`);
  });

  console.log('\n📈 Résumé:');
  console.log(`Main bracket: ${mainMatches.length} matchs`);
  console.log(`Loser bracket: ${loserMatches.length} matchs`);
  console.log(`Final matches: ${finalMatches.length} matchs`);
  console.log(`Total: ${mainMatches.length + loserMatches.length + finalMatches.length} matchs`);
  
  // Pour un double élimination avec 8 joueurs, structure théorique:
  // Main: 7 matchs (4 + 2 + 1)
  // Loser: 5 matchs (2 + 2 + 1)
  // Finals: 2 matchs (playoff + grand final)
  // Total: 14 matchs
  console.log('\nThéorique pour 8 joueurs: 7 main + 5 loser + 2 finals = 14 matchs');
}

analyzeFor8Players();
