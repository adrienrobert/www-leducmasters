# 🏓 Ping Pong Tournament Manager

Une application mobile-first de gestion de tournois de ping-pong en **double élimination** avec **playoff** et **grande finale**, construite avec **Svelte 5**, **SvelteKit**, **Prisma**, et **Tailwind CSS**.

## ✨ Fonctionnalités

- 🏆 **Système de double élimination complet** : Main bracket, Loser bracket, Playoff, et Grande finale
- 📱 **Interface mobile-first** : Optimisée pour les appareils mobiles (max 640px)
- ⚡ **Gestion en temps réel** : Propagation automatique des résultats
- 🎯 **Validation stricte** : Nombre de participants en puissance de 2 (4, 8, 16, 32...)
- 📊 **Suivi de progression** : Barre de progression et statistiques
- 🔄 **Gestion flexible** : Réinitialisation, suppression, partage des tournois
- 🎨 **Interface moderne** : Design épuré avec Tailwind CSS et icônes Lucide
- ♿ **Accessibilité** : Support ARIA, contrastes AA, navigation clavier

## 🛠️ Stack Technique

- **Framework** : Svelte 5 avec SvelteKit
- **Langage** : TypeScript strict
- **Base de données** : SQLite avec Prisma ORM
- **Styling** : Tailwind CSS v4
- **Icônes** : Lucide Svelte
- **Validation** : Zod (côté client et serveur)
- **Tests** : Vitest (unitaires) + Playwright (E2E)
- **Linting** : ESLint + Prettier

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ 
- npm ou pnpm

### Installation

```bash
# Installer les dépendances
npm install

# Configurer la base de données
npm run db:reset

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📋 Scripts Disponibles

```bash
# Développement
npm run dev              # Démarrer le serveur de développement
npm run build           # Construire pour la production
npm run preview         # Prévisualiser la version de production

# Base de données
npm run db:seed         # Peupler la base avec les joueurs par défaut
npm run db:reset        # Réinitialiser et peupler la base
npm run db:generate     # Générer le client Prisma
npm run db:studio       # Ouvrir Prisma Studio

# Tests et qualité
npm run test            # Lancer tous les tests
npm run test:unit       # Tests unitaires seulement
npm run test:e2e        # Tests E2E seulement
npm run lint            # Vérifier le code
npm run format          # Formatter le code
```

## 🎯 Règles du Double Élimination

### Structure du Tournoi

1. **Main Bracket** : Tous les joueurs commencent ici
2. **Loser Bracket** : Les perdants du main bracket y sont rétrogradés
3. **Playoff** : Gagnant du loser bracket vs Perdant de la finale du main
4. **Grande Finale** : Gagnant du main bracket vs Gagnant du playoff

### Fonctionnement

- Une défaite dans le **main bracket** → rétrogradation vers le **loser bracket**
- Une défaite dans le **loser bracket** → élimination définitive
- Le tournoi se termine quand la **grande finale** est jouée

### Algorithme

Le moteur de bracket utilise un système de mapping précis :
- Seeding standard (1 vs n, 2 vs n-1, etc.)
- Routing automatique des perdants vers le loser bracket
- Propagation en temps réel des résultats
- Gestion des matchs playoff et grande finale

## 📊 Modèle de Données

### Tables Principales

- **Player** : Joueurs (8 par défaut : Cécile, Benoit, Nanou, Arthur, Quentin, Agathe, Adrien, Gabin)
- **Tournament** : Tournois avec statut, vainqueur, progression
- **TournamentPlayer** : Association joueurs-tournois avec seeds
- **Match** : Matchs avec scores, bracket, propagation

### Types de Bracket

- `MAIN` : Bracket principal
- `LOSER` : Bracket des perdants  
- `PLAYOFF` : Match de barrage
- `GRAND_FINAL` : Grande finale

## 🏗️ Architecture

```
src/
├── lib/
│   ├── bracket/
│   │   └── engine.ts           # Moteur de génération des brackets
│   ├── components/
│   │   └── MatchCard.svelte    # Composant de match
│   ├── services/
│   │   └── tournament.service.ts # Service de gestion des tournois
│   ├── stores/
│   │   └── index.ts            # Stores Svelte (tournois, toasts)
│   ├── db.ts                   # Configuration Prisma
│   └── types.ts                # Types et schémas Zod
├── routes/
│   ├── api/                    # API REST
│   ├── tournaments/
│   │   ├── create/             # Création de tournoi
│   │   └── [id]/               # Détail de tournoi
│   ├── +layout.svelte          # Layout principal
│   └── +page.svelte            # Page d'accueil
└── tests/
    └── bracket-engine.test.ts  # Tests du moteur
```

## 🧪 Tests

### Tests Unitaires

Le moteur de bracket est testé pour :
- Génération correcte des brackets (4, 8, 16 joueurs)
- Validation des contraintes (puissance de 2)
- Propagation des résultats
- Calcul de progression
- Gestion des erreurs

### Tests E2E

Couvrent les flows utilisateur :
- Création de tournoi complète
- Validation des formulaires
- Saisie de scores
- Navigation entre pages

## 🎨 Design System

### Couleurs
- **Primaire** : Bleu (`blue-600`)
- **Succès** : Vert (`green-600`) 
- **Erreur** : Rouge (`red-600`)
- **Attention** : Ambre (`amber-600`)

### Composants
- **Cartes** : `rounded-2xl` avec ombres douces
- **Boutons** : `rounded-xl` avec états hover/disabled
- **Inputs** : `rounded-xl` avec focus ring
- **Badges** : `rounded-full` pour les statuts

### Responsive
- **Mobile-first** : max-width 640px
- **Scrolling horizontal** : pour les brackets longs
- **Touch-friendly** : boutons et zones de clic adaptés
