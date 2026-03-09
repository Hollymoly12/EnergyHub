# EnergyHub — Contexte Projet

## Vision
Marketplace B2B de la transition énergétique belge. Connecte 6 types d'acteurs : industriels, installateurs, éditeurs logiciels, fonds d'investissement, fournisseurs d'énergie, greentechs.

## Stack Technique
- **Frontend** : Next.js 15.3.6 + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **IA** : Claude API (claude-sonnet-4-20250514) — 4 agents autonomes
- **Paiements** : Stripe (mode test actif)
- **Emails** : Resend (onboarding@resend.dev)
- **Déploiement** : Vercel (auto-deploy sur push main)

## Structure des fichiers
```
src/
  app/
    page.tsx              ✅ Landing page
    layout.tsx            ✅ Root layout
    globals.css           ✅ Styles globaux
    login/page.tsx        ✅ Page connexion
    register/page.tsx     ✅ Page inscription (2 étapes)
    dashboard/
      layout.tsx          ✅ Sidebar navigation
      page.tsx            ✅ Vue d'ensemble
    auth/callback/route.ts ✅ OAuth callback
    api/
      actors/route.ts     ✅ Annuaire API
      rfq/route.ts        ✅ RFQ API
      agents/onboarding/route.ts ✅ Agent onboarding
      stripe/webhook/route.ts   ✅ Stripe webhook
  lib/
    supabase/client.ts    ✅ Client browser
    supabase/server.ts    ✅ Client serveur
    claude/agents.ts      ✅ 4 agents Claude
    stripe/index.ts       ✅ Config Stripe
  middleware.ts           ✅ Auth + feature gating
supabase/
  schema.sql              ✅ 12 tables + RLS + indexes
```

## Base de données — Tables principales
- **organizations** : profils des acteurs (name, slug, actor_type, subscription_plan, profile_completion)
- **members** : utilisateurs liés à une org (id = auth.uid())
- **rfqs** : appels d'offres (title, description, budget, deadline, status, target_actor_types)
- **rfq_responses** : réponses aux RFQ
- **deals** : opportunités d'investissement
- **matches** : scores de compatibilité entre orgs (0-100)
- **conversations + messages** : messagerie interne
- **reviews** : avis et notations
- **agent_logs** : logs des actions IA
- **notifications** : alertes utilisateur

## Les 4 Agents Claude
1. **Onboarding** — déclenché à l'inscription, guide le profil
2. **Matching** — score de compatibilité entre acteurs (0-100)
3. **RFQ Analyste** — analyse et note les réponses aux RFQ
4. **Communication** — génère emails et newsletters personnalisés

## Modèle économique
- **Starter** : gratuit (1 RFQ/mois, pas de réponses)
- **Pro** : €149/mois (RFQ illimités, matching, analytics)
- **Enterprise** : custom (multi-siège, API, support dédié)

## Types d'acteurs (enum actor_type)
industrial | installer | software_editor | investor | energy_provider | esco | greentech

## Variables d'environnement requises
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_ENTERPRISE_MONTHLY,
RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_APP_URL

## Design System
- **Palette** : surface (#080C14, #0D1520, #1E293B, #334155) + brand (amber #F59E0B, green #4ADE80, purple #818CF8, red #EF4444)
- **Typographie** : Syne (font-display) pour titres, DM Sans (font-body) pour texte
- **Composants** : btn-primary, btn-secondary, card, input, label, section-tag (définis dans globals.css)
- **Aesthetic** : dark industrial, high contrast, minimal borders, subtle amber glows
- **Spacing** : 4px base unit, sections py-20, cards p-5/p-7
- **Animations** : transitions 150-200ms, hover -translate-y-0.5

## Pages à construire (priorité)
- [ ] /directory — annuaire avec recherche + filtres
- [ ] /dashboard/profile — complétion profil organisation
- [ ] /rfq — liste + création RFQ
- [ ] /dashboard/matches — matchs IA
- [ ] /dashboard/messages — messagerie
- [ ] /investment — module financement
- [ ] /pricing — page tarifs + upgrade
- [ ] /dashboard/billing — gestion abonnement Stripe

## État actuel
- ✅ Déployé sur Vercel (Next.js 15.3.6)
- ✅ Supabase configuré + schema en place
- ✅ Auth email fonctionnelle
- ✅ Inscription 2 étapes fonctionnelle
- ✅ Dashboard de base accessible
- ⏳ Pages fonctionnelles à construire
- ⏳ RLS Supabase désactivé temporairement sur organizations + members
- ⏳ Stripe en mode test
- ⏳ Google OAuth à configurer

## Conventions de code
- Composants client : "use client" en première ligne
- Composants serveur : async, importent createClient depuis @/lib/supabase/server
- Toujours gérer les états loading, error, empty dans les composants
- Nommage : PascalCase composants, camelCase fonctions, kebab-case fichiers
- Pas de any TypeScript sauf exception justifiée

## Commandes utiles
```bash
npm run dev          # Serveur local sur localhost:3000
npm run build        # Build de production local
git add .
git commit -m "feat: description"
git push             # Déclenche auto-deploy Vercel
```

## Équipe IA — Rôles disponibles
Préfixer chaque demande avec le rôle entre crochets :
[PO] [UX] [ARCHITECT] [FRONTEND] [BACKEND] [DEVOPS] [PM] [ANALYST]
Voir .claude/ pour les instructions détaillées de chaque rôle.
