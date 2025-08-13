import type { MatchBracket, MatchSlot } from '@prisma/client';
import type { BracketPlayer, BracketMatch, LoserRoute, PropagationResult } from '../types.js';

/**
 * Moteur de génération et gestion des brackets de double élimination
 * 
 * Structure du tournament:
 * 1. Main Bracket: tous les joueurs commencent ici
 * 2. Loser Bracket: les perdants du main bracket y sont envoyés
 * 3. Playoff: gagnant du loser bracket vs perdant de la finale du main
 * 4. Grande Finale: gagnant du main bracket vs gagnant du playoff
 * 
 * Mapping du Loser Bracket (exemple pour 8 joueurs):
 * 
 * Main Bracket:
 * Round 1: M1(1v8), M2(4v5), M3(2v7), M4(3v6)
 * Round 2: M5(W_M1 v W_M2), M6(W_M3 v W_M4)  
 * Round 3: M7(W_M5 v W_M6) - FINALE MAIN
 * 
 * Loser Bracket:
 * Round 1: L1(L_M1 v L_M2), L2(L_M3 v L_M4)
 * Round 2: L3(W_L1 v L_M5), L4(W_L2 v L_M6)
 * Round 3: L5(W_L3 v W_L4) - FINALE LOSER
 * 
 * Playoff: P1(W_L5 v L_M7)
 * Grande Finale: GF(W_M7 v W_P1)
 */

export class BracketEngine {
  
  /**
   * Génère le main bracket avec seeding standard
   */
  static generateMainBracket(players: BracketPlayer[], tournamentId: string): BracketMatch[] {
    const n = players.length;
    if (!this.isPowerOfTwo(n) || n < 4) {
      throw new Error('Le nombre de joueurs doit être une puissance de 2 (minimum 4)');
    }

    const matches: BracketMatch[] = [];
    const rounds = Math.log2(n);
    
    // Génération des paires initiales avec seeding standard
    const seededPairs = this.generateSeededPairs(players);
    
    // Round 1 - premiers matchs
    seededPairs.forEach((pair, index) => {
      matches.push({
        id: `${tournamentId}_main_r1_${index}`,
        roundNumber: 1,
        bracket: 'MAIN',
        slotInRound: index,
        playerAId: pair[0].id,
        playerBId: pair[1].id,
        nextMatchId: `${tournamentId}_main_r2_${Math.floor(index / 2)}`,
        nextMatchSlot: index % 2 === 0 ? 'A' : 'B'
      });
    });

    // Rounds suivants
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      
      for (let slot = 0; slot < matchesInRound; slot++) {
        const matchId = `${tournamentId}_main_r${round}_${slot}`;
        
        // Pour le match final du main bracket
        let nextMatchId: string | null = null;
        let nextMatchSlot: MatchSlot | null = null;
        
        if (round < rounds) {
          // Matches intermédiaires pointent vers le round suivant
          nextMatchId = `${tournamentId}_main_r${round + 1}_${Math.floor(slot / 2)}`;
          nextMatchSlot = slot % 2 === 0 ? 'A' : 'B';
        } else {
          // Le match final du main bracket pointe vers la grande finale
          nextMatchId = `${tournamentId}_grand_final_1`;
          nextMatchSlot = 'A';
        }
        
        matches.push({
          id: matchId,
          roundNumber: round,
          bracket: 'MAIN',
          slotInRound: slot,
          playerAId: null,
          playerBId: null,
          nextMatchId,
          nextMatchSlot
        });
      }
    }

    return matches;
  }

  /**
   * Génère le mapping du loser bracket
   * 
   * Pour 4 joueurs:
   * - Perdants M1 et M2 → L1 (slots A et B)
   * - Perdant M3 (finale) → L2 slot B, gagnant L1 → L2 slot A
   * - Gagnant M3 → Grande finale slot A
   * - Gagnant L2 → Grande finale slot B
   * 
   * Pour 8+ joueurs: système simplifié, gagnant finale loser vs gagnant finale main
   */
  static generateLoserMapping(mainMatches: BracketMatch[]): LoserRoute[] {
    const routes: LoserRoute[] = [];
    const n = this.getPlayerCount(mainMatches);
    const mainRounds = Math.log2(n);
    
    // Extraire le tournamentId du premier match
    const tournamentId = mainMatches[0]?.id.split('_')[0] || '';
    
    if (n === 4) {
      // Cas spécial pour 4 joueurs
      for (const mainMatch of mainMatches) {
        if (mainMatch.roundNumber === 1) {
          // Perdants des demi-finales vont au match L1
          const slot: MatchSlot = mainMatch.slotInRound === 0 ? 'A' : 'B';
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_loser_r1_0`,
            slot
          });
        } else if (mainMatch.roundNumber === 2) {
          // Perdant de la finale va au match L2 slot B
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_loser_r2_0`,
            slot: 'B'
          });
        }
      }
    } else if (n === 8) {
      // Cas pour 8 joueurs
      for (const mainMatch of mainMatches) {
        if (mainMatch.roundNumber === 1) {
          // Perdants du round 1 vont au round 1 du loser
          const loserSlot = Math.floor(mainMatch.slotInRound / 2);
          const slot: MatchSlot = mainMatch.slotInRound % 2 === 0 ? 'A' : 'B';
          
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_loser_r1_${loserSlot}`,
            slot
          });
        } else if (mainMatch.roundNumber === 2) {
          // Perdants du round 2 vont au round 2 du loser (slot B)
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_loser_r2_${mainMatch.slotInRound}`,
            slot: 'B'
          });
        } else if (mainMatch.roundNumber === 3) {
          // Perdant de la finale va au round 4 du loser (slot B)
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_loser_r4_0`,
            slot: 'B'
          });
        }
      }
    } else {
      // Logique générale pour n > 8 (à implémenter si nécessaire)
      for (const mainMatch of mainMatches) {
        if (mainMatch.roundNumber === mainRounds) {
          // Perdant de la finale du main va en finale générale (mais pour l'instant, on simplifie)
          routes.push({
            fromMainMatchId: mainMatch.id,
            toLoserMatchId: `${tournamentId}_grand_final_1`,
            slot: 'B'
          });
        }
      }
    }

    return routes;
  }

  /**
   * Génère tous les matchs du loser bracket
   * 
   * Structure du double élimination standard:
   * - Le loser bracket a exactement (n-2) matchs au total
   * - Pour 4 joueurs: 2 matchs
   * - Pour 8 joueurs: 6 matchs - non ! 5 matchs selon la théorie (2*n - 2 - (n-1) = n-1)
   * 
   * Implémentation basée sur la formule: n-2 matchs pour le loser bracket
   */
  static generateLoserBracket(n: number, tournamentId: string): BracketMatch[] {
    const matches: BracketMatch[] = [];
    const targetMatches = n - 2; // Nombre exact de matchs loser pour double élimination
    
    if (n === 4) {
      // 4 joueurs -> 2 matchs loser
      matches.push({
        id: `${tournamentId}_loser_r1_0`,
        roundNumber: 1,
        bracket: 'LOSER',
        slotInRound: 0,
        playerAId: null,
        playerBId: null,
        nextMatchId: `${tournamentId}_loser_r2_0`,
        nextMatchSlot: 'A'
      });
      
      matches.push({
        id: `${tournamentId}_loser_r2_0`,
        roundNumber: 2,
        bracket: 'LOSER',
        slotInRound: 0,
        playerAId: null,
        playerBId: null,
        nextMatchId: `${tournamentId}_grand_final_1`,
        nextMatchSlot: 'B'
      });
    } else if (n === 8) {
      // 8 joueurs -> 6 matchs loser
      // Round 1: perdants des 4 matchs du main R1 se battent 2 par 2
      for (let i = 0; i < 2; i++) {
        matches.push({
          id: `${tournamentId}_loser_r1_${i}`,
          roundNumber: 1,
          bracket: 'LOSER',
          slotInRound: i,
          playerAId: null,
          playerBId: null,
          nextMatchId: `${tournamentId}_loser_r2_${i}`,
          nextMatchSlot: 'A'
        });
      }
      
      // Round 2: gagnants R1 loser vs perdants R2 main
      for (let i = 0; i < 2; i++) {
        matches.push({
          id: `${tournamentId}_loser_r2_${i}`,
          roundNumber: 2,
          bracket: 'LOSER',
          slotInRound: i,
          playerAId: null,
          playerBId: null,
          nextMatchId: `${tournamentId}_loser_r3_0`,
          nextMatchSlot: i === 0 ? 'A' : 'B'
        });
      }
      
      // Round 3: finale loser bracket  
      matches.push({
        id: `${tournamentId}_loser_r3_0`,
        roundNumber: 3,
        bracket: 'LOSER',
        slotInRound: 0,
        playerAId: null,
        playerBId: null,
        nextMatchId: `${tournamentId}_loser_r4_0`,
        nextMatchSlot: 'A'
      });
      
      // Round 4: finale du loser bracket (gagnant R3 vs perdant finale main)
      matches.push({
        id: `${tournamentId}_loser_r4_0`,
        roundNumber: 4,
        bracket: 'LOSER',
        slotInRound: 0,
        playerAId: null, // Gagnant loser_r3_0
        playerBId: null, // Perdant finale main
        nextMatchId: `${tournamentId}_grand_final_1`,
        nextMatchSlot: 'B'
      });
    } else {
      // Pour d'autres tailles, utiliser la logique générale simplifiée
      const mainRounds = Math.log2(n);
      let currentMatchCount = 0;
      let round = 1;
      
      while (currentMatchCount < targetMatches) {
        const remainingMatches = targetMatches - currentMatchCount;
        const matchesInRound = Math.min(remainingMatches, Math.pow(2, Math.max(0, mainRounds - round)));
        
        for (let slot = 0; slot < matchesInRound; slot++) {
          const matchId = `${tournamentId}_loser_r${round}_${slot}`;
          const isLastMatch = currentMatchCount + slot + 1 === targetMatches;
          
          matches.push({
            id: matchId,
            roundNumber: round,
            bracket: 'LOSER',
            slotInRound: slot,
            playerAId: null,
            playerBId: null,
            nextMatchId: isLastMatch ? null : `${tournamentId}_loser_r${round + 1}_${Math.floor(slot / 2)}`,
            nextMatchSlot: isLastMatch ? null : (slot % 2 === 0 ? 'A' : 'B')
          });
        }
        
        currentMatchCount += matchesInRound;
        round++;
      }
    }

    return matches;
  }

  /**
   * Génère les matchs playoff et grande finale
   */
  static generateFinalMatches(tournamentId: string, playerCount: number): BracketMatch[] {
    // Pour tous les cas, seulement une grande finale
    return [
      {
        id: `${tournamentId}_grand_final_1`,
        roundNumber: 1,
        bracket: 'GRAND_FINAL',
        slotInRound: 0,
        playerAId: null, // Gagnant finale main
        playerBId: null, // Gagnant finale loser
        nextMatchId: null,
        nextMatchSlot: null
      }
    ];
  }

  /**
   * Applique le résultat d'un match et propage les changements
   */
  static applyResult(
    matches: BracketMatch[],
    matchId: string,
    scoreA: number,
    scoreB: number
  ): PropagationResult {
    const match = matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error(`Match ${matchId} non trouvé`);
    }

    if (!match.playerAId || !match.playerBId) {
      throw new Error('Les deux joueurs doivent être définis pour enregistrer un score');
    }

    if (scoreA === scoreB) {
      throw new Error('Les scores ne peuvent pas être égaux');
    }

    const winnerId = scoreA > scoreB ? match.playerAId : match.playerBId;
    const loserId = scoreA > scoreB ? match.playerBId : match.playerAId;
    
    const updatedMatches: BracketMatch[] = [...matches];
    const updatedMatch = updatedMatches.find(m => m.id === matchId)!;
    
    // Mise à jour du match actuel
    Object.assign(updatedMatch, {
      scoreA,
      scoreB,
      winnerId,
      loserId,
      locked: true
    });

    // Propagation du gagnant
    if (match.nextMatchId) {
      const nextMatch = updatedMatches.find(m => m.id === match.nextMatchId);
      if (nextMatch && match.nextMatchSlot) {
        if (match.nextMatchSlot === 'A') {
          nextMatch.playerAId = winnerId;
        } else {
          nextMatch.playerBId = winnerId;
        }
      }
    }

    // Propagation du perdant (si main bracket)
    if (match.bracket === 'MAIN') {
      const loserRoutes = this.generateLoserMapping(matches.filter(m => m.bracket === 'MAIN'));
      const route = loserRoutes.find(r => r.fromMainMatchId === matchId);
      
      if (route) {
        const loserMatch = updatedMatches.find(m => m.id === route.toLoserMatchId);
        if (loserMatch) {
          if (route.slot === 'A') {
            loserMatch.playerAId = loserId;
          } else {
            loserMatch.playerBId = loserId;
          }
        }
      }
    }

    // Vérifier si le tournoi est terminé
    const grandFinal = updatedMatches.find(m => m.bracket === 'GRAND_FINAL');
    const tournamentComplete = !!(grandFinal?.winnerId);
    const tournamentWinnerId = grandFinal?.winnerId || null;

    return {
      updatedMatches,
      tournamentComplete,
      winnerId: tournamentWinnerId
    };
  }

  /**
   * Calcule la progression du tournoi
   */
  static computeProgress(matches: BracketMatch[]): { played: number; total: number; percent: number } {
    const total = matches.length;
    const played = matches.filter(m => m.winnerId).length;
    const percent = total > 0 ? Math.round((played / total) * 100) : 0;
    
    return { played, total, percent };
  }

  /**
   * Génère les paires avec seeding standard
   */
  private static generateSeededPairs(players: BracketPlayer[]): [BracketPlayer, BracketPlayer][] {
    const n = players.length;
    const pairs: [BracketPlayer, BracketPlayer][] = [];
    
    // Trier par seed
    const sortedPlayers = [...players].sort((a, b) => a.seed - b.seed);
    
    // Seeding standard: 1 vs n, 2 vs n-1, etc.
    for (let i = 0; i < n / 2; i++) {
      pairs.push([sortedPlayers[i], sortedPlayers[n - 1 - i]]);
    }
    
    return pairs;
  }

  /**
   * Détermine le nombre de joueurs à partir des matchs du main bracket
   */
  private static getPlayerCount(mainMatches: BracketMatch[]): number {
    const round1Matches = mainMatches.filter(m => m.roundNumber === 1);
    return round1Matches.length * 2;
  }

  /**
   * Vérifie si un nombre est une puissance de 2
   */
  private static isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }
}
