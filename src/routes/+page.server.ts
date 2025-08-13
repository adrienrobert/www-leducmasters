import { TournamentService } from '$lib/services/tournament.service.js';

export const load = async () => {
  try {
    const tournaments = await TournamentService.getAllTournaments();
    return {
      tournaments
    };
  } catch (error) {
    console.error('Erreur lors du chargement des tournois:', error);
    return {
      tournaments: []
    };
  }
};
