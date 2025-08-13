import { writable } from 'svelte/store';
import type { TournamentWithDetails, PlayerWithTournaments } from '../types.js';

// Store pour la liste des tournois
export const tournaments = writable<TournamentWithDetails[]>([]);

// Store pour le tournoi actuellement affiché
export const currentTournament = writable<TournamentWithDetails | null>(null);

// Store pour la liste des joueurs
export const players = writable<PlayerWithTournaments[]>([]);

// Store pour les messages de notification
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export const toasts = writable<Toast[]>([]);

// Fonctions utilitaires pour les toasts
export const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = crypto.randomUUID();
  const newToast: Toast = {
    id,
    duration: 5000,
    ...toast
  };

  toasts.update(current => [...current, newToast]);

  // Auto-suppression après la durée spécifiée
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }

  return id;
};

export const removeToast = (id: string) => {
  toasts.update(current => current.filter(toast => toast.id !== id));
};

// Store pour l'état de chargement global
export const loading = writable<boolean>(false);

// Store pour les erreurs globales
export const error = writable<string | null>(null);
