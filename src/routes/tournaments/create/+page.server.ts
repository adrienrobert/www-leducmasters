import { TournamentService } from '$lib/services/tournament.service.js';

export const load = async () => {
  try {
    const players = await TournamentService.getAllPlayers();
    return {
      players
    };
  } catch (error) {
    console.error('Erreur lors du chargement des joueurs:', error);
    return {
      players: []
    };
  }
};
