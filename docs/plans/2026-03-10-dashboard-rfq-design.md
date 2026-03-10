# Design — F6: /dashboard/rfq

**Date:** 2026-03-10
**Feature:** Dashboard RFQ — gestion des appels d'offres de l'organisation connectée

## Objectif

Page de gestion des RFQs propres à l'organisation connectée. Permet de voir, publier, clôturer et supprimer ses appels d'offres, avec stats par RFQ.

## Architecture

### Fichiers

- `src/app/dashboard/rfq/page.tsx` — Server Component, fetch Supabase direct
- `src/app/dashboard/rfq/actions.ts` — Server Actions (updateStatus, deleteRFQ)
- `src/app/dashboard/rfq/RFQDashboardCard.tsx` — Client Component (interactions UI)

### Approche

Server Component + Server Actions (Next.js 15 App Router). Pas d'API route dédiée. Cohérent avec le pattern `dashboard/profile`.

## Données

Query Supabase depuis le server component :

```
rfqs (*, rfq_responses count, views_count)
WHERE organization_id = org_id
ORDER BY created_at DESC
```

Stats par card : `views_count`, `response_count` (count depuis rfq_responses), statut IA depuis `agent_logs` (présence d'un log de type rfq_analysis pour ce rfq_id).

## UI

### Header
- Titre "Mes appels d'offres"
- Bouton "+ Publier un RFQ" → /rfq/create

### Onglets (filtre client-side)
Tous | Publiés | Brouillons | Clôturés

### Cards (grid identique à /rfq)
Reprend le design RFQCard existant + ajouts :
- Badge statut : draft=gris, published=vert, closed=rouge/slate
- Stats bar : 👁 X vues · 📬 X réponses · 🤖 Analysé / En attente
- Menu actions :
  - "Publier" (draft uniquement)
  - "Clôturer" (published uniquement)
  - "Supprimer" (draft uniquement, avec confirmation)

### État vide
CTA vers /rfq/create

## Server Actions

### updateRFQStatus(rfqId, newStatus)
- Vérifie ownership (organization_id = org de l'user)
- Update `status` + `published_at` (si passage à published)
- Transitions autorisées : draft→published, published→closed

### deleteRFQ(rfqId)
- Vérifie ownership
- Suppression uniquement si status=draft
- Refuse la suppression d'un RFQ publié ou clôturé
