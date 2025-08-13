import { test, expect } from '@playwright/test';

test.describe('Ping Pong Tournament App', () => {
  test('should create and manage a tournament', async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/');

    // Vérifier que la page d'accueil se charge
    await expect(page.locator('h1')).toContainText('Leduc Masters');

    // Créer un nouveau tournoi
    await page.click('text=Créer un tournoi');
    
    // Remplir le formulaire
    await page.fill('input[id="title"]', 'Test Tournament E2E');
    await page.fill('input[id="location"]', 'Test Location');
    
    // Sélectionner 4 joueurs (les premiers disponibles)
    const playerButtons = page.locator('button:has-text("Cécile"), button:has-text("Benoit"), button:has-text("Nanou"), button:has-text("Arthur")');
    
    for (let i = 0; i < 4; i++) {
      await playerButtons.nth(i).click();
    }

    // Vérifier que le bouton de création est activé
    await expect(page.locator('button:has-text("Créer le tournoi")')).toBeEnabled();

    // Créer le tournoi
    await page.click('text=Créer le tournoi');

    // Vérifier la redirection vers la page du tournoi
    await expect(page.locator('h1')).toContainText('Test Tournament E2E');
    await expect(page.locator('text=Main Bracket')).toBeVisible();

    // Vérifier que les matchs du premier round sont présents
    await expect(page.locator('text=Round 1')).toBeVisible();
    
    // Tenter de saisir un score (si possible)
    const scoreButtons = page.locator('button:has-text("Saisir le score")');
    if (await scoreButtons.count() > 0) {
      await scoreButtons.first().click();
      
      // Saisir des scores
      await page.fill('input[type="number"]', '11');
      await page.fill('input[type="number"]', '9');
      
      // Valider le score
      await page.click('button:has-text("Valider")');
      
      // Vérifier qu'un message de succès apparaît
      await expect(page.locator('text=Score enregistré avec succès')).toBeVisible();
    }

    // Retourner à l'accueil
    await page.click('button[aria-label="Retour"]');
    
    // Vérifier que le tournoi apparaît dans la liste avec une progression
    await expect(page.locator('text=Test Tournament E2E')).toBeVisible();
  });

  test('should validate tournament creation form', async ({ page }) => {
    await page.goto('/tournaments/create');

    // Vérifier que le bouton est désactivé sans titre
    await expect(page.locator('button:has-text("Créer le tournoi")')).toBeDisabled();

    // Remplir le titre
    await page.fill('input[id="title"]', 'Test Tournament');

    // Sélectionner 3 joueurs (nombre invalide)
    const playerButtons = page.locator('button:has-text("Cécile"), button:has-text("Benoit"), button:has-text("Nanou")');
    for (let i = 0; i < 3; i++) {
      await playerButtons.nth(i).click();
    }

    // Le bouton devrait toujours être désactivé
    await expect(page.locator('button:has-text("Créer le tournoi")')).toBeDisabled();

    // Vérifier le message d'erreur
    await expect(page.locator('text=Le nombre de joueurs doit être une puissance de 2')).toBeVisible();

    // Ajouter un 4ème joueur
    await page.click('button:has-text("Arthur")');

    // Maintenant le bouton devrait être activé
    await expect(page.locator('button:has-text("Créer le tournoi")')).toBeEnabled();
  });

  test('should display tournament details correctly', async ({ page }) => {
    // Cette test nécessite qu'il y ait des tournois existants
    await page.goto('/');
    
    // Si il y a des tournois, tester l'ouverture d'un
    const tournamentCards = page.locator('text=Ouvrir le tournoi');
    
    if (await tournamentCards.count() > 0) {
      await tournamentCards.first().click();
      
      // Vérifier les éléments de la page de tournoi
      await expect(page.locator('text=Main Bracket')).toBeVisible();
      await expect(page.locator('text=Participants')).toBeVisible();
      await expect(page.locator('text=Informations')).toBeVisible();
      
      // Vérifier la barre de progression
      await expect(page.locator('.bg-blue-600')).toBeVisible(); // Barre de progression
    }
  });
});
