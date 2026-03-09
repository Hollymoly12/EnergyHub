# F5 — Création RFQ (`/rfq/create`)

## Contexte
Formulaire de création d'appels d'offres pour les membres Pro d'EnergyHub. Wizard 3 étapes avec validation côté client.

## Accès
- Non-connecté → redirect `/login`
- Plan Free/Starter → redirect `/pricing`
- Plan Pro/Enterprise → accès complet

## Architecture
- `src/app/rfq/create/page.tsx` — Server Component : vérifie auth + plan, redirige si nécessaire
- `src/app/rfq/create/RFQCreateForm.tsx` — Client Component : wizard 3 étapes

## Wizard 3 étapes

### Étape 1 — Infos de base
- Type : RFQ / RFI / RFP (radio, requis)
- Titre (input texte, requis)
- Description (textarea, requis)
- Exigences techniques (textarea, optionnel)

### Étape 2 — Ciblage
- Types d'acteurs ciblés (checkboxes multiples, 7 types)
- Technologies ciblées (tag input)
- Régions ciblées (checkboxes : Wallonie / Flandre / Bruxelles-Capitale)
- Budget (input texte, ex. "50k–100k€", optionnel)
- Deadline (date picker, optionnel)
- Localisation (input texte, optionnel)
- Tags (tag input, optionnel)

### Étape 3 — Révision + publication
- Résumé de tous les champs remplis
- Bouton "Publier maintenant" → POST `/api/rfq` avec `publish: true` → redirect `/rfq/[id]`
- Bouton "Sauvegarder en draft" → POST avec `publish: false` → redirect `/rfq/[id]`

## UX
- Barre de progression (3 étapes numérotées) en haut du formulaire
- Validation avant passage à l'étape suivante (titre + description requis à l'étape 1)
- Boutons Précédent / Suivant entre étapes
- État loading pendant la soumission (boutons désactivés)

## API utilisée
`POST /api/rfq` — champs : `type`, `title`, `description`, `requirements`, `budget_range`, `deadline`, `location`, `target_actor_types`, `target_technologies`, `target_regions`, `tags`, `publish`

## Design system
- Fond `#080C14`, classes `.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`
- Composant `TagInput` (pattern déjà utilisé dans ProfileForm.tsx)
- Tailwind vanilla uniquement
