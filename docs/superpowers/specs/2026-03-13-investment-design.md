# Design — F12: Module Investissement

**Date:** 2026-03-13
**Feature:** Module investissement — liste, détail, soumission deals, dashboard

## Décisions clés

- Tous les types d'acteurs (Pro) peuvent créer un deal
- Pages : `/investment` (liste) + `/investment/[id]` (détail) + `/investment/submit` (formulaire) + `/dashboard/investment` (mes deals)
- NDA : checkbox "Je m'engage à respecter la confidentialité" + `nda_signed_at` timestamp en DB
- Formulaire de soumission : 3 étapes (Projet → Financement → Documents & Publication)
- Agent IA déclenché après soumission : génère `ai_summary`, `ai_investment_thesis`, `ai_risk_score`
- Architecture : API routes centrales + Server Components (cohérent avec RFQ, profile)

## Architecture

### Fichiers à créer

```
src/app/investment/
  page.tsx                    — Server Component (liste publique, PRO_ROUTES)
  [id]/
    page.tsx                  — Server Component (détail deal)
    InterestButton.tsx        — Client Component (modal NDA + intérêt)
  submit/
    page.tsx                  — Server Component wrapper (PROTECTED_ROUTES)
    DealForm.tsx              — Client Component (formulaire 3 étapes)

src/app/dashboard/investment/
  page.tsx                    — Server Component (mes deals + intérêts reçus)

src/app/api/
  deals/route.ts              — POST créer deal → déclenche agent IA
  deal-interests/route.ts     — POST exprimer intérêt + NDA
```

### Fichiers existants utilisés

- `src/lib/claude/agents.ts` — agent `analyzeDeal` (à créer/compléter)
- `src/lib/supabase/server.ts` — createClient
- `src/middleware.ts` — `/investment` déjà dans PRO_ROUTES, `/investment/submit` dans PROTECTED_ROUTES

## Pages & UI

### `/investment` — Liste publique

- Accessible uniquement aux utilisateurs Pro (middleware redirige vers /pricing si free)
- Header : tag "Investissement", h1, sous-titre
- Filtres (côté client) : type de projet (solar/wind/storage/efficiency/other), type de financement (equity/debt/convertible/grant), statut published uniquement
- Grille de cartes : titre, organisation, montant formaté (€), type de financement, IRR cible (%), badge type projet, bouton "Voir le deal"
- Seuls les deals avec `status = 'published'` sont affichés

### `/investment/[id]` — Détail deal

- Fetch deal par ID (Server Component)
- Sections :
  - Header : titre, org name, date publication, badge NDA si `requires_nda = true`
  - Description + infos projet (type, localisation, capacité MW)
  - Financement : montant, type, série, IRR cible, durée, investisseurs actuels
  - Section IA (si `ai_summary` disponible) : résumé, thèse d'investissement, barre score risque (0=vert/low, 100=rouge/high)
- Le Server Component vérifie si l'utilisateur a déjà exprimé son intérêt (fetch `deal_interests` filtré sur `investor_org_id + deal_id`) et incrémente `views_count` via `supabase.rpc` ou update direct
- CTA : `<InterestButton dealId={id} requiresNda={deal.requires_nda} alreadyExpressed={alreadyExpressed} />`

**`InterestButton.tsx`** (Client Component) :
- Props : `dealId: string`, `requiresNda: boolean`, `alreadyExpressed: boolean`
- Si `alreadyExpressed = true` → bouton désactivé "Intérêt déjà exprimé" (pas de modal)
- Sinon : bouton "Exprimer mon intérêt" → ouvre modal
- Modal : si NDA requis → checkbox "Je m'engage à respecter la confidentialité de ce dossier" (required), champ message optionnel
- Bouton "Confirmer" → POST `/api/deal-interests` → état succès "Intérêt enregistré !"

### `/investment/submit` — Formulaire 3 étapes

**`DealForm.tsx`** (Client Component) — état local `step: 1 | 2 | 3` :

**Étape 1 — Projet**
- Titre (required)
- Description (required, textarea)
- Type de projet : select (solar | wind | storage | efficiency | other)
- Localisation (text)
- Capacité MW (number, optionnel)

**Étape 2 — Financement**
- Montant recherché en € (number, required)
- Type de financement : select (equity | debt | convertible | grant)
- Série : select (pre-seed | seed | series-a | series-b | growth | other, optionnel)
- IRR cible % (number, optionnel)
- Durée en années (number, optionnel)
- Investisseurs actuels (textarea, optionnel)

**Étape 3 — Documents & Publication**
- URL pitch deck (text, optionnel)
- URL modèle financier (text, optionnel)
- NDA requis : toggle (default: true)
- Preview résumé des infos saisies
- Bouton "Soumettre le deal" → POST `/api/deals` → redirect `/dashboard/investment?submitted=1`

### `/dashboard/investment` — Dashboard

- Section "Mes deals" : tableau ou liste de cartes avec titre, statut badge (draft/published), vues (`views_count`), intérêts (`interests_count`), lien vers `/investment/[id]`
- Section "Intérêts reçus" : liste des `deal_interests` sur mes deals → org investisseur, message, NDA signé (✓/✗), date, statut affiché (interested/in_discussion/passed) — la gestion du changement de statut est hors scope F12 (lecture seule)
- Bouton "Nouveau deal" → `/investment/submit`
- Banner success si `?submitted=1`

## API

### POST `/api/deals`

1. Auth + fetch member (organization_id)
2. Valider champs required (title, description, funding_amount)
3. Insert dans `deals` avec `status: 'published'`, `published_at: new Date().toISOString()` (soumission directe). Le boolean `requires_nda` gère la confidentialité — le statut enum `nda_required` n'est pas utilisé (la distinction NDA se fait via `requires_nda = true` + `status = 'published'`)
4. Déclencher agent IA de façon **synchrone** (`await analyzeDeal(deal)`) — contrairement au pattern RFQ qui est fire-and-forget, ici on attend le résultat avant de répondre. L'appel bloque la réponse API (~3-5s acceptable pour une soumission de deal). Update `ai_summary`, `ai_investment_thesis`, `ai_risk_score` sur le deal.
5. Retourner `{ id, success: true }`

### POST `/api/deal-interests`

1. Auth + fetch member (organization_id)
2. Body : `dealId`, `message?`, `ndaSigned: boolean`
3. Vérifier que l'utilisateur n'a pas déjà exprimé son intérêt (`deal_interests` unique sur deal_id + investor_org_id)
4. Si deal `requires_nda` et `ndaSigned = false` → 400
5. Insert dans `deal_interests` avec `nda_signed`, `nda_signed_at` (si ndaSigned = true)
6. Incrémenter `deals.interests_count` via `UPDATE deals SET interests_count = interests_count + 1 WHERE id = dealId`
7. Retourner `{ success: true }`

## Migration DB requise

L'enum `agent_event_type` ne contient pas `'deal_analysis'`. Avant d'implémenter l'agent, exécuter :
```sql
ALTER TYPE agent_event_type ADD VALUE 'deal_analysis';
```
Cette migration doit être la première tâche du plan d'implémentation.

## Agent IA — analyzeDeal

Nouvel agent dans `src/lib/claude/agents.ts` :

```
Prompt : "Tu es un expert en finance d'entreprise et en énergie renouvelable. Analyse ce projet d'investissement et fournis :
1. Un résumé exécutif (2-3 phrases)
2. Une thèse d'investissement (pourquoi investir ou non, 2-3 phrases)
3. Un score de risque de 0 à 100 (0 = risque très faible, 100 = risque très élevé)"

Input : titre, description, type, montant, financement, IRR, durée, localisation
Output : { summary, investmentThesis, riskScore }
```

## Schéma DB — colonnes utilisées

Table `deals` : id, organization_id, created_by, title, description, project_type, location, capacity_mw, funding_amount, funding_type, series, irr_target, duration_years, current_investors, pitch_deck_url, financial_model_url, requires_nda, status, views_count, interests_count, ai_summary, ai_investment_thesis, ai_risk_score, published_at, created_at

Table `deal_interests` : id, deal_id, investor_org_id, expressed_by, nda_signed, nda_signed_at, message, status, created_at
