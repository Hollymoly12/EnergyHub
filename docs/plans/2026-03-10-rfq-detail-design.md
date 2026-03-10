# Design — F8: /rfq/[id]

**Date:** 2026-03-10
**Feature:** Page de détail d'un RFQ + formulaire de réponse

## Objectif

Page publique (SSR, indexable) affichant le détail complet d'un RFQ et permettant aux utilisateurs connectés de soumettre une réponse (limite 1/mois pour les Free).

## Architecture

### Fichiers
- `src/app/rfq/[id]/page.tsx` — Server Component, fetch RFQ + réponses
- `src/app/rfq/[id]/ResponseForm.tsx` — Client Component, formulaire de réponse
- `src/app/rfq/[id]/actions.ts` — Server Action `submitResponse`

### Approche
Server Component + Server Action. Pattern identique à F6 dashboard/rfq.

## Page de détail

### Header
- Badge type (RFQ/RFI/RFP, coloré)
- Titre h1
- Org émettrice : logo + nom + ville + badge is_verified

### Corps
- Description complète (pas de line-clamp)
- Requirements si présents (bloc séparé avec label "Cahier des charges")
- Chips : budget · deadline · location
- target_actor_types en chips
- Tags

### Sidebar sticky (desktop)
- Résumé IA (ai_summary) si disponible
- Bouton scroll vers formulaire
- Lien "← Retour aux RFQs"
- Count de réponses (si > 0)

## Formulaire de réponse

### Visibilité
- Connecté + RFQ status published/responses_open/under_review
- Si non connecté : message + lien /login
- Si l'org a déjà répondu : afficher la réponse existante en lecture seule

### Champs
- message (textarea, requis, min 50 chars)
- price_range (input text, optionnel, placeholder "ex: 50 000€ - 80 000€")
- delivery_timeline (input text, optionnel, placeholder "ex: 3 mois")

### Limite Free
- 1 réponse/mois max pour les orgs Free
- Si atteinte : message d'info + lien /pricing
- Compté sur rfq_responses.submitted_at >= début du mois courant

### Post-soumission
- Message de succès inline
- Formulaire remplacé par récapitulatif de la réponse soumise

## Server Action submitResponse

1. Auth (getUser) → 401 si absent
2. getMember avec organizations(subscription_plan) → 404 si absent
3. Vérifier limit Free : count rfq_responses du mois pour l'org
4. Vérifier doublon : org a déjà répondu à ce rfq_id → erreur explicite
5. Insérer rfq_responses (rfq_id, organization_id, submitted_by, message, price_range, delivery_timeline)
6. revalidatePath("/rfq/[id]")
