import { json, type RequestHandler } from '@sveltejs/kit';
import { TournamentService } from '$lib/services/tournament.service.js';
import { z } from 'zod';

const createPlayerSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(50, 'Le nom est trop long')
});

export const GET: RequestHandler = async () => {
  try {
    const players = await TournamentService.getAllPlayers();
    return json({ success: true, data: players });
  } catch (error) {
    console.error('Erreur API GET /players:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Erreur lors de la récupération des joueurs' 
        } 
      },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validation des données
    const validation = createPlayerSchema.safeParse(body);
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

    const { name } = validation.data;
    const player = await TournamentService.createPlayer(name);
    
    return json({ success: true, data: player }, { status: 201 });
  } catch (error) {
    console.error('Erreur API POST /players:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'CREATE_ERROR', 
          message: error instanceof Error ? error.message : 'Erreur lors de la création du joueur' 
        } 
      },
      { status: 400 }
    );
  }
};
