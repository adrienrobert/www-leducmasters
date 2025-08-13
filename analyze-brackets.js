import { BracketEngine } from './src/lib/bracket/engine.js';

console.log('🔍 Analyse de la génération de brackets pour 4 joueurs');

const players = [
  { id: 'p1', name: 'Player 1', seed: 1 },
  { id: 'p2', name: 'Player 2', seed: 2 },
  { id: 'p3', name: 'Player 3', seed: 3 },
  { id: 'p4', name: 'Player 4', seed: 4 }
];

console.log('\n📊 Main Bracket:');
const mainMatches = BracketEngine.generateMainBracket(players, 'test');
mainMatches.forEach(match => {
  console.log(`  ${match.id} - Round ${match.roundNumber}, Slot ${match.slotInRound}`);
  console.log(`    Players: ${match.playerAId || 'TBD'} vs ${match.playerBId || 'TBD'}`);
  console.log(`    Next: ${match.nextMatchId || 'Final'}`);
});

console.log('\n📊 Loser Bracket:');
const loserMatches = BracketEngine.generateLoserBracket(4, 'test');
loserMatches.forEach(match => {
  console.log(`  ${match.id} - Round ${match.roundNumber}, Slot ${match.slotInRound}`);
  console.log(`    Next: ${match.nextMatchId || 'Final'}`);
});

console.log('\n📊 Final Matches:');
const finalMatches = BracketEngine.generateFinalMatches('test');
finalMatches.forEach(match => {
  console.log(`  ${match.id} - ${match.bracket}`);
  console.log(`    Next: ${match.nextMatchId || 'End'}`);
});

console.log('\n📈 Résumé:');
console.log(`Main bracket: ${mainMatches.length} matchs`);
console.log(`Loser bracket: ${loserMatches.length} matchs`);
console.log(`Final matches: ${finalMatches.length} matchs`);
console.log(`Total: ${mainMatches.length + loserMatches.length + finalMatches.length} matchs`);
