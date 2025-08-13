import { describe, it, expect } from 'vitest';
import { BracketEngine } from '../lib/bracket/engine.js';
import type { BracketPlayer } from '../lib/types.js';

describe('BracketEngine', () => {
  const createPlayers = (count: number): BracketPlayer[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `player-${i + 1}`,
      name: `Player ${i + 1}`,
      seed: i + 1
    }));
  };

  describe('generateMainBracket', () => {
    it('should generate correct bracket for 4 players', () => {
      const players = createPlayers(4);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');

      expect(matches).toHaveLength(3); // 3 matches for 4 players
      
      // Vérifier le premier round
      const round1 = matches.filter(m => m.roundNumber === 1);
      expect(round1).toHaveLength(2);
      
      // Vérifier le seeding (1 vs 4, 2 vs 3)
      expect(round1[0].playerAId).toBe('player-1');
      expect(round1[0].playerBId).toBe('player-4');
      expect(round1[1].playerAId).toBe('player-2');
      expect(round1[1].playerBId).toBe('player-3');
    });

    it('should generate correct bracket for 8 players', () => {
      const players = createPlayers(8);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');

      expect(matches).toHaveLength(7); // 7 matches for 8 players
      
      // Vérifier les rounds
      const round1 = matches.filter(m => m.roundNumber === 1);
      const round2 = matches.filter(m => m.roundNumber === 2);
      const round3 = matches.filter(m => m.roundNumber === 3);
      
      expect(round1).toHaveLength(4);
      expect(round2).toHaveLength(2);
      expect(round3).toHaveLength(1);
    });

    it('should throw error for invalid player count', () => {
      const players = createPlayers(5); // Pas une puissance de 2
      
      expect(() => {
        BracketEngine.generateMainBracket(players, 'tournament-1');
      }).toThrow('Le nombre de joueurs doit être une puissance de 2');
    });

    it('should throw error for less than 4 players', () => {
      const players = createPlayers(2);
      
      expect(() => {
        BracketEngine.generateMainBracket(players, 'tournament-1');
      }).toThrow('Le nombre de joueurs doit être une puissance de 2');
    });
  });

  describe('generateLoserMapping', () => {
    it('should generate correct loser mapping for 4 players', () => {
      const players = createPlayers(4);
      const mainMatches = BracketEngine.generateMainBracket(players, 'tournament-1');
      const loserRoutes = BracketEngine.generateLoserMapping(mainMatches);

      expect(loserRoutes).toHaveLength(3); // 3 matches dans le main = 3 routes vers le loser
    });

    it('should generate correct loser mapping for 8 players', () => {
      const players = createPlayers(8);
      const mainMatches = BracketEngine.generateMainBracket(players, 'tournament-1');
      const loserRoutes = BracketEngine.generateLoserMapping(mainMatches);

      expect(loserRoutes).toHaveLength(7); // 7 matches dans le main = 7 routes vers le loser
    });
  });

  describe('generateFinalMatches', () => {
    it('should generate only grand final for 4 players', () => {
      const finalMatches = BracketEngine.generateFinalMatches('test-tournament', 4);

      expect(finalMatches).toHaveLength(1);
      
      const grandFinal = finalMatches.find(m => m.bracket === 'GRAND_FINAL');
      expect(grandFinal).toBeDefined();
    });

    it('should generate only grand final for 8+ players too', () => {
      const finalMatches = BracketEngine.generateFinalMatches('test-tournament', 8);

      expect(finalMatches).toHaveLength(1);
      
      const grandFinal = finalMatches.find(m => m.bracket === 'GRAND_FINAL');
      expect(grandFinal).toBeDefined();
    });
  });

  describe('applyResult', () => {
    it('should apply result and propagate winner', () => {
      const players = createPlayers(4);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');
      
      // Appliquer le résultat du premier match
      const result = BracketEngine.applyResult(matches, 'tournament-1_main_r1_0', 11, 9);

      expect(result.updatedMatches).toBeDefined();
      
      const updatedMatch = result.updatedMatches.find(m => m.id === 'tournament-1_main_r1_0');
      expect(updatedMatch?.scoreA).toBe(11);
      expect(updatedMatch?.scoreB).toBe(9);
      expect(updatedMatch?.winnerId).toBe('player-1'); // Player 1 gagne 11-9
      expect(updatedMatch?.loserId).toBe('player-4');
      expect(updatedMatch?.locked).toBe(true);

      // Vérifier la propagation vers le match suivant
      const nextMatch = result.updatedMatches.find(m => m.id === 'tournament-1_main_r2_0');
      expect(nextMatch?.playerAId).toBe('player-1'); // Le gagnant est propagé
    });

    it('should throw error for equal scores', () => {
      const players = createPlayers(4);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');
      
      expect(() => {
        BracketEngine.applyResult(matches, 'tournament-1_main_r1_0', 10, 10);
      }).toThrow('Les scores ne peuvent pas être égaux');
    });

    it('should throw error for match without both players', () => {
      const players = createPlayers(4);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');
      
      // Essayer d'appliquer un résultat à un match du round 2 (pas encore de joueurs)
      expect(() => {
        BracketEngine.applyResult(matches, 'tournament-1_main_r2_0', 11, 9);
      }).toThrow('Les deux joueurs doivent être définis');
    });
  });

  describe('computeProgress', () => {
    it('should compute correct progress', () => {
      const players = createPlayers(4);
      const matches = BracketEngine.generateMainBracket(players, 'tournament-1');
      
      // Aucun match joué
      let progress = BracketEngine.computeProgress(matches);
      expect(progress.played).toBe(0);
      expect(progress.total).toBe(3);
      expect(progress.percent).toBe(0);

      // Jouer le premier match
      const result = BracketEngine.applyResult(matches, 'tournament-1_main_r1_0', 11, 9);
      progress = BracketEngine.computeProgress(result.updatedMatches);
      expect(progress.played).toBe(1);
      expect(progress.total).toBe(3);
      expect(progress.percent).toBe(33); // Math.round(1/3 * 100)
    });
  });

  describe('complete tournament flow', () => {
    it('should handle complete 4-player tournament', () => {
      const players = createPlayers(4);
      const tournamentId = 'tournament-1';
      let matches = BracketEngine.generateMainBracket(players, tournamentId);
      
      // Ajouter les matches du loser bracket et finaux
      const loserMatches = BracketEngine.generateLoserBracket(4, tournamentId);
      const finalMatches = BracketEngine.generateFinalMatches(tournamentId, 4);
      matches = [...matches, ...loserMatches, ...finalMatches];

      // Round 1: Player 1 bat Player 4
      let result = BracketEngine.applyResult(matches, `${tournamentId}_main_r1_0`, 11, 9);
      matches = result.updatedMatches;

      // Round 1: Player 2 bat Player 3
      result = BracketEngine.applyResult(matches, `${tournamentId}_main_r1_1`, 11, 8);
      matches = result.updatedMatches;

      // Finale main: Player 1 bat Player 2
      result = BracketEngine.applyResult(matches, `${tournamentId}_main_r2_0`, 11, 7);
      matches = result.updatedMatches;

      // Vérifier que le tournoi n'est pas encore terminé (pas de grande finale jouée)
      expect(result.tournamentComplete).toBe(false);

      // La finale du loser bracket devrait être jouée entre Player 4 et Player 3
      // puis le playoff entre le gagnant et Player 2 (perdant de la finale main)
      // puis la grande finale entre Player 1 et le gagnant du playoff
    });
  });
});
