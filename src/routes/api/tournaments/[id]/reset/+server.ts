import { json, type RequestHandler } from '@sveltejs/kit';
import { TournamentService } from '$lib/services/tournament.service.js';

export const POST: RequestHandler = async ({ params }) => {
  try {
    if (!params?.id) {
      return json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_ID', 
            message: 'ID de tournoi invalide' 
          } 
        },
        { status: 400 }
      );
    }

    const tournament = await TournamentService.resetTournament(params.id);
    return json({ success: true, data: tournament });
  } catch (error) {
    console.error('Erreur API POST /tournaments/[id]/reset:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'RESET_ERROR', 
          message: 'Erreur lors de la réinitialisation du tournoi' 
        } 
      },
      { status: 500 }
    );
  }
};
