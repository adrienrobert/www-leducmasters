import { z } from 'zod';
import type { TournamentStatus, MatchBracket, MatchSlot } from '@prisma/client';

// Schémas de validation pour les formulaires
export const createTournamentSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire').max(100, 'Le titre est trop long'),
  location: z.string().optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Date invalide'),
  playerIds: z
    .array(z.string())
    .min(4, 'Minimum 4 participants')
    .refine((players) => {
      const n = players.length;
      return n > 0 && (n & (n - 1)) === 0; // Vérifie que c'est une puissance de 2
    }, 'Le nombre de participants doit être une puissance de 2 (4, 8, 16, 32...)')
});

export const updateMatchScoreSchema = z.object({
  scoreA: z.number().int().min(0, 'Le score doit être positif'),
  scoreB: z.number().int().min(0, 'Le score doit être positif')
}).refine((data) => data.scoreA !== data.scoreB, 'Les scores ne peuvent pas être égaux');

// Types pour l'API
export interface TournamentWithDetails {
  id: string;
  title: string;
  location: string | null;
  date: Date;
  status: TournamentStatus;
  winnerId: string | null;
  createdAt: Date;
  winner: {
    id: string;
    name: string;
  } | null;
  players: {
    id: string;
    playerId: string;
    seed: number;
    player: {
      id: string;
      name: string;
    };
  }[];
  matches: MatchWithDetails[];
  progress: {
    played: number;
    total: number;
    percent: number;
  };
}

export interface MatchWithDetails {
  id: string;
  tournamentId: string;
  roundNumber: number;
  bracket: MatchBracket;
  slotInRound: number;
  playerAId: string | null;
  playerBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  loserId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: MatchSlot | null;
  locked: boolean;
  createdAt: Date;
  playerA: {
    id: string;
    name: string;
  } | null;
  playerB: {
    id: string;
    name: string;
  } | null;
  winner: {
    id: string;
    name: string;
  } | null;
  loser: {
    id: string;
    name: string;
  } | null;
}

export interface PlayerWithTournaments {
  id: string;
  name: string;
  createdAt: Date;
}

// Types pour les erreurs API
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Types pour le moteur de bracket
export interface BracketPlayer {
  id: string;
  name: string;
  seed: number;
}

export interface BracketMatch {
  id: string;
  roundNumber: number;
  bracket: MatchBracket;
  slotInRound: number;
  playerAId: string | null;
  playerBId: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerId?: string | null;
  loserId?: string | null;
  nextMatchId: string | null;
  nextMatchSlot: MatchSlot | null;
  locked?: boolean;
}

export interface LoserRoute {
  fromMainMatchId: string;
  toLoserMatchId: string;
  slot: MatchSlot;
}

export interface PropagationResult {
  updatedMatches: BracketMatch[];
  tournamentComplete: boolean;
  winnerId: string | null;
}

// Utilitaires
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).format(date);
}
