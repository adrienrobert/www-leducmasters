import { prisma } from '../db.js';
import { BracketEngine } from '../bracket/engine.js';
import type { TournamentWithDetails, BracketPlayer, BracketMatch } from '../types.js';
import type { MatchBracket, MatchSlot, TournamentStatus } from '@prisma/client';

export class TournamentService {
  
  /**
   * Récupère tous les tournois avec leurs détails
   */
  static async getAllTournaments(): Promise<TournamentWithDetails[]> {
    const tournaments = await prisma.tournament.findMany({
      include: {
        winner: true,
        players: {
          include: {
            player: true
          },
          orderBy: {
            seed: 'asc'
          }
        },
        matches: {
          include: {
            playerA: true,
            playerB: true,
            winner: true,
            loser: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return tournaments.map(tournament => ({
      ...tournament,
      progress: BracketEngine.computeProgress(tournament.matches as any)
    }));
  }

  /**
   * Récupère un tournoi par son ID
   */
  static async getTournamentById(id: string): Promise<TournamentWithDetails | null> {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        winner: true,
        players: {
          include: {
            player: true
          },
          orderBy: {
            seed: 'asc'
          }
        },
        matches: {
          include: {
            playerA: true,
            playerB: true,
            winner: true,
            loser: true
          },
          orderBy: [
            { bracket: 'asc' },
            { roundNumber: 'asc' },
            { slotInRound: 'asc' }
          ]
        }
      }
    });

    if (!tournament) return null;

    return {
      ...tournament,
      progress: BracketEngine.computeProgress(tournament.matches as any)
    };
  }

  /**
   * Crée un nouveau tournoi avec les matchs du bracket
   */
  static async createTournament(data: {
    title: string;
    location?: string;
    date: Date;
    playerIds: string[];
  }): Promise<TournamentWithDetails> {
    const { title, location, date, playerIds } = data;

    // Vérifier que le nombre de joueurs est valide
    if (!BracketEngine['isPowerOfTwo'](playerIds.length) || playerIds.length < 4) {
      throw new Error('Le nombre de joueurs doit être une puissance de 2 (minimum 4)');
    }

    // Vérifier que tous les joueurs existent
    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds }
      }
    });

    if (players.length !== playerIds.length) {
      throw new Error('Certains joueurs n\'existent pas');
    }

    // Créer les données des joueurs avec seeds
    const bracketPlayers: BracketPlayer[] = playerIds.map((playerId, index) => {
      const player = players.find(p => p.id === playerId)!;
      return {
        id: player.id,
        name: player.name,
        seed: index + 1
      };
    });

    const tournamentResult = await prisma.$transaction(async (tx) => {
      // Créer le tournoi
      const tournament = await tx.tournament.create({
        data: {
          title,
          location,
          date,
          status: 'ACTIVE'
        }
      });

      // Créer les associations joueurs-tournoi
      const tournamentPlayers = await Promise.all(
        bracketPlayers.map(player =>
          tx.tournamentPlayer.create({
            data: {
              tournamentId: tournament.id,
              playerId: player.id,
              seed: player.seed
            }
          })
        )
      );

      // Générer tous les matchs
      const mainMatches = BracketEngine.generateMainBracket(bracketPlayers, tournament.id);
      const loserMapping = BracketEngine.generateLoserMapping(mainMatches);
      const loserMatches = BracketEngine.generateLoserBracket(bracketPlayers.length, tournament.id);
      const finalMatches = BracketEngine.generateFinalMatches(tournament.id, bracketPlayers.length);
      
      const allMatches = [...mainMatches, ...loserMatches, ...finalMatches];

      // Créer les matchs en base
      await Promise.all(
        allMatches.map(match =>
          tx.match.create({
            data: {
              id: match.id,
              tournamentId: tournament.id,
              roundNumber: match.roundNumber,
              bracket: match.bracket,
              slotInRound: match.slotInRound,
              playerAId: match.playerAId,
              playerBId: match.playerBId,
              nextMatchId: match.nextMatchId,
              nextMatchSlot: match.nextMatchSlot,
              locked: false
            }
          })
        )
      );

      // Retourner simplement l'ID du tournoi créé
      return tournament.id;
    });
    
    // Récupérer le tournoi complet après la transaction
    const result = await TournamentService.getTournamentById(tournamentResult);
    
    if (!result) {
      throw new Error('Impossible de récupérer le tournoi créé');
    }
    
    return result;
  }

  /**
   * Met à jour le score d'un match
   */
  static async updateMatchScore(
    matchId: string,
    scoreA: number,
    scoreB: number
  ): Promise<TournamentWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // Récupérer le match et le tournoi
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: true
        }
      });

      if (!match) {
        throw new Error('Match non trouvé');
      }

      if (match.locked) {
        throw new Error('Ce match est verrouillé');
      }

      if (!match.playerAId || !match.playerBId) {
        throw new Error('Les deux joueurs doivent être définis');
      }

      if (scoreA === scoreB) {
        throw new Error('Les scores ne peuvent pas être égaux');
      }

      // Récupérer tous les matchs du tournoi
      const allMatches = await tx.match.findMany({
        where: { tournamentId: match.tournamentId }
      });

      // Appliquer le résultat avec le moteur de bracket
      const result = BracketEngine.applyResult(
        allMatches as any,
        matchId,
        scoreA,
        scoreB
      );

      // Mettre à jour tous les matchs modifiés
      await Promise.all(
        result.updatedMatches.map(async (updatedMatch) => {
          const updateData: any = {
            playerAId: updatedMatch.playerAId,
            playerBId: updatedMatch.playerBId,
            nextMatchId: updatedMatch.nextMatchId,
            nextMatchSlot: updatedMatch.nextMatchSlot
          };

          // Ajouter les données de score si présentes
          if (updatedMatch.scoreA !== undefined) updateData.scoreA = updatedMatch.scoreA;
          if (updatedMatch.scoreB !== undefined) updateData.scoreB = updatedMatch.scoreB;
          if (updatedMatch.winnerId !== undefined) updateData.winnerId = updatedMatch.winnerId;
          if (updatedMatch.loserId !== undefined) updateData.loserId = updatedMatch.loserId;
          if (updatedMatch.locked !== undefined) updateData.locked = updatedMatch.locked;

          await tx.match.update({
            where: { id: updatedMatch.id },
            data: updateData
          });
        })
      );

      // Mettre à jour le statut du tournoi si terminé
      if (result.tournamentComplete && result.winnerId) {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: {
            status: 'COMPLETED',
            winnerId: result.winnerId
          }
        });
      }

      // Retourner le tournoi mis à jour
      return await this.getTournamentById(match.tournamentId) as TournamentWithDetails;
    });
  }

  /**
   * Supprime un tournoi
   */
  static async deleteTournament(id: string): Promise<void> {
    await prisma.tournament.delete({
      where: { id }
    });
  }

  /**
   * Réinitialise les scores d'un tournoi
   */
  static async resetTournament(id: string): Promise<TournamentWithDetails> {
    return await prisma.$transaction(async (tx) => {
      // Réinitialiser tous les matchs
      await tx.match.updateMany({
        where: { tournamentId: id },
        data: {
          scoreA: null,
          scoreB: null,
          winnerId: null,
          loserId: null,
          locked: false
        }
      });

      // Vider les joueurs des matchs sauf le premier round du main bracket
      await tx.match.updateMany({
        where: {
          tournamentId: id,
          NOT: {
            AND: [
              { bracket: 'MAIN' },
              { roundNumber: 1 }
            ]
          }
        },
        data: {
          playerAId: null,
          playerBId: null
        }
      });

      // Remettre le tournoi en statut ACTIVE
      await tx.tournament.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          winnerId: null
        }
      });

      return await this.getTournamentById(id) as TournamentWithDetails;
    });
  }

  /**
   * Récupère tous les joueurs
   */
  static async getAllPlayers() {
    return await prisma.player.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Crée un nouveau joueur
   */
  static async createPlayer(name: string) {
    return await prisma.player.create({
      data: { name }
    });
  }
}
