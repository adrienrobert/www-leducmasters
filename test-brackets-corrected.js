import { BracketEngine } from './src/lib/bracket/engine.js';

// Test pour différents nombres de joueurs
async function testBrackets() {
  console.log('🔍 Test de la génération de brackets après correction\n');

  // Test pour 4 joueurs
  console.log('📊 Test pour 4 joueurs:');
  testForNPlayers(4);
  
  console.log('\n📊 Test pour 8 joueurs:');
  testForNPlayers(8);
}

function testForNPlayers(n) {
  const players = Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1
  }));

  const tournamentId = `test-${n}`;
  
  // Générer tous les matchs
  const mainMatches = BracketEngine.generateMainBracket(players, tournamentId);
  const loserMatches = BracketEngine.generateLoserBracket(n, tournamentId);
  const finalMatches = BracketEngine.generateFinalMatches(tournamentId, n);
  
  console.log(`  Main bracket: ${mainMatches.length} matchs`);
  console.log(`  Loser bracket: ${loserMatches.length} matchs`);
  console.log(`  Final matches: ${finalMatches.length} matchs`);
  console.log(`  Total: ${mainMatches.length + loserMatches.length + finalMatches.length} matchs`);
  
  // Vérifications théoriques
  const expectedMain = n - 1; // n-1 matchs pour éliminer n-1 joueurs
  const expectedTotal = 2 * n - 2; // Théorie du double élimination
  const actualTotal = mainMatches.length + loserMatches.length + finalMatches.length;
  
  console.log(`  Attendu (théorique): ${expectedTotal} matchs`);
  console.log(`  ${actualTotal === expectedTotal ? '✅' : '❌'} Correct: ${actualTotal === expectedTotal}`);
}

testBrackets().catch(console.error);
