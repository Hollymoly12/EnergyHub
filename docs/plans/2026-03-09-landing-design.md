# F3 — Landing Page Design

## Contexte
Page d'accueil d'EnergyHub, marketplace B2B de la transition énergétique belge. Remplace le placeholder actuel (`src/app/page.tsx`). Objectif mixte : acquisition de nouveaux inscrits + crédibilité pour les visiteurs référés. Plateforme en early stage : pas de vrais chiffres ni témoignages.

## Approche
Narrative verticale — page unique statique qui raconte une histoire et adresse 3 profils cibles (Industriels, Installateurs, Greentechs).

## Cibles prioritaires
1. **Industriels** — publient des RFQ, cherchent des prestataires
2. **Installateurs** — répondent aux RFQ, veulent des commandes qualifiées
3. **Greentechs** — cherchent clients B2B et visibilité investisseurs

## Architecture
- Fichier unique : `src/app/page.tsx` (server component, remplace le placeholder)
- Entièrement statique, aucune API, aucun state client
- Navbar intégrée à la page (le layout global `src/app/layout.tsx` n'a pas de navbar)

## Structure des blocs (7 sections)

### 1. NAVBAR
- Logo ⚡ EnergyHub (lien vers `/`)
- Liens : Annuaire (`/directory`), RFQ (`/rfq`)
- CTA : "Se connecter" (texte) + "S'inscrire" (btn-primary)

### 2. HERO
- Badge : `⚡ Marketplace B2B · Belgique`
- H1 : "Connectez-vous aux acteurs de la transition énergétique"
- Sous-titre : "EnergyHub réunit industriels, installateurs et greentechs sur une seule plateforme — avec matching IA et RFQ intégrés."
- CTA principal : "S'inscrire gratuitement →" (→ `/register`)
- CTA secondaire : "Parcourir l'annuaire" (→ `/directory`)

### 3. PROBLÈME — 3 pain points
- "Un marché fragmenté" — des centaines d'acteurs, impossible de s'y retrouver
- "Des appels d'offres inefficaces" — des mois de prospection pour trouver le bon partenaire
- "Des opportunités manquées" — les greentechs peinent à accéder aux grands comptes

### 4. SOLUTION — Comment ça marche (3 étapes)
1. Créez votre profil organisation (type d'acteur, expertise, certifications)
2. Publiez ou répondez à des RFQ ciblés
3. L'IA EnergyHub calcule les meilleures correspondances et vous met en relation

### 5. POUR VOUS — 3 colonnes par profil cible
| ⚡ Industriels | 🔧 Installateurs | 🌱 Greentechs |
|---|---|---|
| Publiez vos RFQ et trouvez les bons prestataires | Répondez aux appels d'offres qualifiés | Trouvez vos premiers clients industriels |
| • Matching IA | • Profil certifié | • Accès investisseurs |
| • RFQ illimités (Pro) | • Alertes RFQ ciblées | • Module deal flow |
| • Annuaire fournisseurs | • Messagerie intégrée | • Visibilité B2B |

### 6. CHIFFRES ASPIRATIONNELS
- 6 types d'acteurs connectés
- Matching IA en temps réel
- 3 régions belges couvertes
- Gratuit pour démarrer

### 7. CTA FINAL
- Titre : "Rejoignez la marketplace de la transition énergétique belge"
- Sous-titre : "Inscription gratuite · Aucune CB requise · Déployé en Belgique"
- Bouton : "S'inscrire gratuitement →" (→ `/register`)

## Contraintes techniques
- Classes CSS custom disponibles : `.card`, `.btn-primary`, `.btn-secondary`, `.section-tag`
- Tailwind vanilla (pas de tokens custom) : `bg-slate-900`, `text-yellow-500`, `text-slate-400`, etc.
- Fond global : `#080C14`
- Pas de `"use client"` — composant serveur pur
