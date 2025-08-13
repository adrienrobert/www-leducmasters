#!/bin/bash

echo "🚀 Script de déploiement pour Vercel"
echo "=====================================

# Vérifier que l'URL PostgreSQL est configurée
if [[ $DATABASE_URL == *"postgresql"* ]]; then
    echo "✅ PostgreSQL détecté"
    
    # Générer le client Prisma
    echo "📦 Génération du client Prisma..."
    npx prisma generate
    
    # Pousser le schéma vers la base
    echo "🗄️  Synchronisation du schéma..."
    npx prisma db push
    
    # Seeder la base (optionnel en production)
    echo "🌱 Seeding de la base..."
    npm run db:seed
    
    echo "✅ Base de données configurée avec succès!"
    echo "Vous pouvez maintenant redéployer sur Vercel"
    
else
    echo "⚠️  Attention: DATABASE_URL ne pointe pas vers PostgreSQL"
    echo "Assurez-vous d'avoir configuré une base PostgreSQL (Neon, Supabase, etc.)"
    echo "Format attendu: postgresql://user:password@host:5432/database"
fi
