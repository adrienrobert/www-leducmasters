import { TournamentService } from '$lib/services/tournament.service.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }: { params: { id: string } }) => {
  try {
    if (!params.id) {
      throw error(400, 'ID de tournoi manquant');
    }

    const tournament = await TournamentService.getTournamentById(params.id);
    
    if (!tournament) {
      throw error(404, 'Tournoi non trouvé');
    }

    return {
      tournament
    };
  } catch (err) {
    console.error('Erreur lors du chargement du tournoi:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Erreur lors du chargement du tournoi');
  }
};
