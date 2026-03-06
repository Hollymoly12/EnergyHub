# ⚡ EnergyHub — Marketplace B2B Énergie Belge

La plateforme qui connecte tous les acteurs de la transition énergétique belge.

## 🚀 Démarrage Rapide (pour non-techniques)

### Étape 1 — Créer les comptes services (30 min)

1. **GitHub** : https://github.com — Créer un compte, uploader ce dossier
2. **Supabase** : https://supabase.com — Nouveau projet, région "West EU (Ireland)"
3. **Vercel** : https://vercel.com — Connecter votre repo GitHub
4. **Stripe** : https://stripe.com — Créer les produits Pro et Enterprise
5. **Resend** : https://resend.com — Vérifier votre domaine email
6. **Anthropic** : https://console.anthropic.com — Obtenir votre clé API Claude

### Étape 2 — Configurer la base de données (10 min)

1. Aller sur Supabase → SQL Editor
2. Copier-coller le contenu de `supabase/schema.sql`
3. Cliquer "Run" — la base de données est prête ✅

### Étape 3 — Variables d'environnement (15 min)

1. Copier `.env.example` en `.env.local`
2. Remplir chaque variable avec vos clés
3. Dans Vercel : Settings → Environment Variables → ajouter toutes les variables

### Étape 4 — Déploiement (5 min)

```bash
# Option A : Via Vercel (recommandé, sans ligne de commande)
# → Connecter GitHub à Vercel → déploiement automatique à chaque push

# Option B : En local pour tester
npm install
npm run dev
# Ouvrir http://localhost:3000
```

### Étape 5 — Configurer Stripe Webhook (10 min)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
3. Événements à écouter :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

---

## 🏗️ Architecture

```
energyhub/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing page
│   │   ├── (auth)/               ← Login / Register
│   │   ├── dashboard/            ← Espace membre
│   │   ├── directory/            ← Annuaire acteurs
│   │   ├── rfq/                  ← RFI/RFQ engine
│   │   ├── investment/           ← Module financement
│   │   └── api/
│   │       ├── agents/           ← 4 agents Claude
│   │       ├── stripe/           ← Webhooks paiement
│   │       ├── rfq/              ← API RFQ
│   │       └── actors/           ← API annuaire
│   ├── lib/
│   │   ├── claude/agents.ts      ← 🤖 LES 4 AGENTS IA
│   │   ├── supabase/             ← Client BDD
│   │   └── stripe/               ← Paiements
│   └── middleware.ts             ← Auth + feature gating
├── supabase/
│   └── schema.sql                ← Schéma BDD complet
└── .env.example                  ← Variables à configurer
```

## 🤖 Les 4 Agents Claude

| Agent | Rôle | Déclencheur automatique |
|-------|------|------------------------|
| **Onboarding** | Accueille et guide les nouveaux acteurs | Nouvelle inscription |
| **Matching** | Calcule les scores de compatibilité | Nouveau profil / RFQ publié |
| **RFQ Analyste** | Score les réponses, génère des synthèses | RFQ publié / Réponse reçue |
| **Communication** | Génère emails et newsletters personnalisés | Match trouvé / Alerte RFQ |

### Coût estimé des agents (Claude API)
- ~500 tokens par analyse onboarding = ~€0.003/nouvel inscrit
- ~1500 tokens par matching = ~€0.009/RFQ publié
- ~2000 tokens par scoring réponse = ~€0.012/réponse
- Budget total estimé : **€50-200/mois** pour 500 acteurs actifs

## 💳 Plans & Fonctionnalités

| Feature | Starter (Gratuit) | Pro (€149/mois) | Enterprise |
|---------|-------------------|-----------------|------------|
| Profil listé | ✅ basique | ✅ premium | ✅ featured |
| Annuaire | Limité | ✅ illimité | ✅ illimité |
| RFQ/mois | 1 | ✅ illimité | ✅ illimité |
| Répondre aux RFQ | ❌ | ✅ | ✅ |
| Module investissement | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ avancés |
| Support | Email | Prioritaire | Manager dédié |

## 🔑 Gestion sans équipe technique

Toutes les opérations quotidiennes sont gérables via des interfaces visuelles :

- **Supabase Dashboard** : voir les utilisateurs, modifier des données, surveiller les requêtes
- **Stripe Dashboard** : voir les paiements, gérer les abonnements, émettre des remboursements
- **Vercel Dashboard** : voir les déploiements, les logs, les performances
- **PostHog Dashboard** : analytics produit, funnels, rétention

## 🆘 Support & Questions

- Documentation Supabase : https://supabase.com/docs
- Documentation Stripe : https://stripe.com/docs
- Documentation Vercel : https://vercel.com/docs
- Documentation Claude API : https://docs.anthropic.com
