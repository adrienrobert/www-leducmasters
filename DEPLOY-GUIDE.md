# 🚀 Guide de déploiement Vercel + PostgreSQL

## Problème identifié
Votre application utilise SQLite qui ne fonctionne pas sur Vercel (environnement serverless).

## Solution : PostgreSQL + Neon (gratuit)

### 1. Créer une base de données PostgreSQL gratuite
1. Allez sur [neon.tech](https://neon.tech)
2. Créez un compte gratuit
3. Créez un nouveau projet "pingpong-prod"
4. Copiez l'URL de connexion (format: postgresql://...)

### 2. Configurer les variables d'environnement sur Vercel
1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez:
   - `DATABASE_URL` = votre URL PostgreSQL de Neon

### 3. Mettre à jour votre .env local
```bash
# Pour développement local - gardez SQLite
DATABASE_URL="file:./dev.db"

# Pour tester en local avec PostgreSQL (optionnel)
# DATABASE_URL="postgresql://votre-url-neon"
```

### 4. Générer et déployer le schéma
```bash
# Avec PostgreSQL dans .env
npx prisma generate
npx prisma db push
npm run db:seed

# Puis redéployer sur Vercel
git add .
git commit -m "Configure PostgreSQL for production"
git push
```

### 5. Alternative : Base de données hybride
Vous pouvez aussi garder SQLite en développement et PostgreSQL en production en modifiant le schema.prisma :

```prisma
datasource db {
  provider = "sqlite"      // pour dev local
  // provider = "postgresql"  // pour production
  url      = env("DATABASE_URL")
}
```

## Scripts modifiés
- ✅ `prisma/schema.prisma` → PostgreSQL
- ✅ `package.json` → script vercel-build amélioré
- ✅ `.env.example` créé pour documentation

## Prochaines étapes
1. Créez votre base Neon
2. Ajoutez DATABASE_URL sur Vercel
3. Redéployez votre application
