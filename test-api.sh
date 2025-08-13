#!/bin/bash

echo "🧪 Test de l'API HTTP de création de tournoi"

# Test avec HTTPie si disponible, sinon curl
if command -v http >/dev/null 2>&1; then
    echo "Utilisation de HTTPie..."
    http POST localhost:5173/api/tournaments \
        title="Test HTTP Tournament" \
        location="Test Location" \
        date="2025-08-13" \
        playerIds:='["cme9q3zea0006ygrqfw4mknba", "cme9q3ze90005ygrqi8n72z9u", "cme9r9gru0009yg2ompoacfzn", "cme9q3ze80003ygrq5p6s7oty"]'
else
    echo "Utilisation de curl..."
    curl -s -X POST http://localhost:5173/api/tournaments \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test HTTP Tournament",
            "location": "Test Location",
            "date": "2025-08-13",
            "playerIds": ["cme9q3zea0006ygrqfw4mknba", "cme9q3ze90005ygrqi8n72z9u", "cme9r9gru0009yg2ompoacfzn", "cme9q3ze80003ygrq5p6s7oty"]
        }' | jq '.' 2>/dev/null || echo "Response received but jq not available"
fi
