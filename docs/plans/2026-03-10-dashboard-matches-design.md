# Design — F7: /dashboard/matches

**Date:** 2026-03-10
**Feature:** Dashboard Matches — vue des correspondances IA de l'organisation connectée

## Objectif

Page affichant les matchs IA de l'organisation (dans les deux sens), avec déclenchement manuel du matching si aucun match existant.

## Architecture

### Fichiers

- `src/app/dashboard/matches/page.tsx` — Server Component, fetch matchs depuis Supabase
- `src/app/dashboard/matches/MatchesClient.tsx` — Client Component (onglets, bouton IA, spinner)
- `src/app/api/agents/matching/route.ts` — POST, déclenche runMatchingAgent

### Approche

Server Component + API route pour le déclenchement de l'agent (non-bloquant). Le bouton "Lancer le matching IA" fait un fetch POST, affiche un spinner, puis recharge la page via `router.refresh()`.

## Données

Deux queries Supabase depuis le server component :

```sql
-- Matchs initiés par l'org (source)
SELECT matches.*, organizations AS target_org
FROM matches
JOIN organizations ON matches.target_org_id = organizations.id
WHERE source_org_id = org_id
ORDER BY match_score DESC

-- Matchs reçus par l'org (cible)
SELECT matches.*, organizations AS source_org
FROM matches
JOIN organizations ON matches.source_org_id = organizations.id
WHERE target_org_id = org_id
ORDER BY match_score DESC
```

Mergé en un seul array côté serveur avec `direction: "sent" | "received"` et l'org matchée normalisée.

## UI

### Header
- Titre "Mes matchs IA" + badge count total
- Indicateur "X non vus" si is_viewed = false

### Onglets (filtre client-side)
Tous | Reçus | Initiés | Non vus

### Cards (grille 3 colonnes)
- Logo + nom + type d'acteur (org matchée)
- Score de compatibilité : badge coloré (vert ≥70, jaune 40-69, rouge <40)
- match_reasons[] en chips (max 3)
- Contexte : lié à un RFQ (titre) ou "Networking général"
- Badge "Nouveau" si !is_viewed
- Direction badge : "Reçu" ou "Initié"
- Boutons : "Voir le profil →" (/directory/[slug]) + "Contacter" (/dashboard/messages)

### État vide
- Texte : "Aucun match IA pour le moment"
- Bouton "Lancer le matching IA" → POST /api/agents/matching → spinner → router.refresh()

## API /api/agents/matching (POST)

1. Authentifier l'user, récupérer son org avec toutes ses données
2. Fetch candidats : toutes les orgs sauf la sienne (limit 20 pour contrôler les tokens)
3. Appeler `runMatchingAgent` (déjà dans agents.ts) — sauvegarde les matches en BDD
4. Retourner `{ success: true, matchesCreated: number }`

Note : `runMatchingAgent` sauvegarde déjà les matches ≥60 en BDD via upsert.

## Agent matching existant

`runMatchingAgent` dans `src/lib/claude/agents.ts` :
- Input : sourceOrgId, sourceOrgData, candidateOrgs[], context
- Sauvegarde automatiquement les matches ≥60 dans la table `matches` via upsert
- Upsert sur conflict `source_org_id,target_org_id`
