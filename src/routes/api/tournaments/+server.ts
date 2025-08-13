import { json, type RequestHandler } from '@sveltejs/kit';
import { TournamentService } from '$lib/services/tournament.service.js';

export const GET: RequestHandler = async () => {
  try {
    const tournaments = await TournamentService.getAllTournaments();
    return json({ success: true, data: tournaments });
  } catch (error) {
    console.error('Erreur API GET /tournaments:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Erreur lors de la récupération des tournois' 
        } 
      },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const tournament = await TournamentService.createTournament({
      title: data.title,
      location: data.location,
      date: new Date(data.date),
      playerIds: data.playerIds
    });
    
    return json({ success: true, data: tournament }, { status: 201 });
  } catch (error) {
    console.error('Erreur API POST /tournaments:', error);
    return json(
      { 
        success: false, 
        error: { 
          code: 'CREATE_ERROR', 
          message: error instanceof Error ? error.message : 'Erreur lors de la création du tournoi' 
        } 
      },
      { status: 400 }
    );
  }
};
