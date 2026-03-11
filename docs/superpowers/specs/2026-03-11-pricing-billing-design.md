# Design — F10: /pricing + F11: /dashboard/billing

**Date:** 2026-03-11
**Features:** Page tarifs publique + gestion abonnement Stripe

## Décisions clés

- `/pricing` est publique (accessible sans compte)
- Upgrade Pro : modal de confirmation inline → redirect Stripe Checkout
- Enterprise : formulaire de contact inline → email via Resend
- `/dashboard/billing` : minimal — affichage plan + redirect Stripe Portal
- Stripe Portal gère nativement : historique factures, annulation, mise à jour CB

## Architecture

### Fichiers à créer

```
src/app/pricing/
  page.tsx              — Server Component (public, fetch plan si connecté)
  PricingClient.tsx     — Client Component (modals Pro + Enterprise)

src/app/dashboard/billing/
  page.tsx              — Server Component (protégé middleware)

src/app/api/stripe/
  checkout/route.ts     — POST → createCheckoutSession → { url }
  portal/route.ts       — POST → createBillingPortalSession → { url }

src/app/api/contact/
  route.ts              — POST → Resend email Enterprise
```

### Fichiers modifiés

- `src/middleware.ts` — ajouter `/dashboard/billing` aux PROTECTED_ROUTES (déjà couvert par `/dashboard/*`)

## UI

### `/pricing/page.tsx`

**Header** : tag "Tarifs", h1 "Choisissez votre plan", sous-titre accrocheur.

**3 cartes côte à côte** (`max-w-5xl mx-auto grid grid-cols-3 gap-6`) :

| | Starter | Pro | Enterprise |
|---|---|---|---|
| Prix | €0 | €149/mois | Sur devis |
| Bordure | slate-800 | yellow-500 (badge "Populaire") | purple-500/30 |
| Features | 1 RFQ/mois, Annuaire | RFQ illimités, Matching IA, Analytics, Module investissement | Tout Pro + multi-sièges, API, support dédié |
| CTA non-connecté | "Commencer" → /register | "Passer au Pro" → modal | "Nous contacter" → modal |
| CTA connecté Free | désactivé "Plan actuel" | "Passer au Pro" → modal | "Nous contacter" → modal |
| CTA connecté Pro | — | désactivé "Plan actuel" | "Nous contacter" → modal |

### `PricingClient.tsx`

**Modal Pro** :
- Overlay `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`
- Titre "Passer au plan Pro", résumé features clés, prix "€149/mois — résiliable à tout moment"
- Bouton "Confirmer et payer" → POST `/api/stripe/checkout` → `router.push(url)` (redirect Stripe)
- État loading pendant le POST

**Modal Enterprise** :
- Formulaire : prénom/nom, email, message (optionnel)
- Bouton "Envoyer" → POST `/api/contact` → Resend → message de succès inline

### `/dashboard/billing/page.tsx`

- Fetch `organizations` : `subscription_plan`, `stripe_customer_id`
- **Plan Free** : badge "Starter", description limites, bouton "Passer au Pro" → lien `/pricing`
- **Plan Pro/Enterprise** : badge coloré, description, bouton "Gérer l'abonnement" → form POST `/api/stripe/portal` → redirect

## API

### POST `/api/stripe/checkout`

1. Auth + fetch member (`organization_id`, `stripe_customer_id`, email org)
2. `getOrCreateStripeCustomer` si pas de customer → `UPDATE organizations SET stripe_customer_id`
3. `createCheckoutSession({ priceId: PLANS.pro.priceId, successUrl: /dashboard/billing?success=1, cancelUrl: /pricing })`
4. Retourne `{ url }`

### POST `/api/stripe/portal`

1. Auth + fetch `stripe_customer_id`
2. Si absent : erreur 400 "Aucun abonnement actif"
3. `createBillingPortalSession(customerId, /dashboard/billing)`
4. Retourne `{ url }`

### POST `/api/contact`

1. Validation : name, email required
2. Resend : `from: EMAIL_FROM`, `to: EMAIL_FROM` (même adresse), sujet "Demande Enterprise — EnergyHub"
3. Retourne `{ success: true }`

## Flux Stripe complet

```
/pricing → modal Pro → POST /api/stripe/checkout
         → redirect stripe.com/checkout
         → paiement OK → webhook customer.subscription.created
         → organizations.subscription_plan = "pro"
         → redirect /dashboard/billing?success=1
```

## États UI à gérer

- `PricingClient` : `modal: "pro" | "enterprise" | null`, `loading`, `success` (Enterprise)
- `billing/page.tsx` : `searchParams.success` → banner "Abonnement activé !"
