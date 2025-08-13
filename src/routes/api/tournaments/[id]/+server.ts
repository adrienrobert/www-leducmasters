import { json, type RequestHandler } from '@sveltejs/kit';
import { TournamentService } from '$lib/services/tournament.service.js';

export const GET: RequestHandler = async ({ params }) => {
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

    const tournament = await TournamentService.getTournamentById(params.id);
    
    if (!tournament) {
      return json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Tournoi non trouvé' 
          } 
        },
        { status: 404 }
      );
    }
    
    return json({ success: true, data: tournament });
  } catch (error) {
    console.error('Erreur API GET /tournaments/[id]:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Erreur lors de la récupération du tournoi' 
        } 
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
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

    await TournamentService.deleteTournament(params.id);
    return json({ success: true });
  } catch (error) {
    console.error('Erreur API DELETE /tournaments/[id]:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'DELETE_ERROR', 
          message: 'Erreur lors de la suppression du tournoi' 
        } 
      },
      { status: 500 }
    );
  }
};
