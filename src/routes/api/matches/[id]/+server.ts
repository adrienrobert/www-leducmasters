import { json, type RequestHandler } from '@sveltejs/kit';
import { TournamentService } from '$lib/services/tournament.service.js';
import { updateMatchScoreSchema } from '$lib/types.js';
import { z } from 'zod';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    if (!params?.id) {
      return json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_ID', 
            message: 'ID de match invalide' 
          } 
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validation des données
    const validation = updateMatchScoreSchema.safeParse(body);
    if (!validation.success) {
      return json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Données invalides',
            details: validation.error.flatten()
          } 
        },
        { status: 400 }
      );
    }

    const { scoreA, scoreB } = validation.data;
    const tournament = await TournamentService.updateMatchScore(params.id, scoreA, scoreB);
    
    return json({ success: true, data: tournament });
  } catch (error) {
    console.error('Erreur API PATCH /matches/[id]:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'UPDATE_ERROR', 
          message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du score' 
        } 
      },
      { status: 400 }
    );
  }
};
