# F4 — Page RFQ (`/rfq`)

## Contexte
Liste publique des appels d'offres publiés sur EnergyHub. Accessible sans connexion mais limitée à 12 cartes pour les non-connectés.

## Accès
| Utilisateur | `/rfq` |
|-------------|--------|
| Non connecté | 12 cartes + CTA inscription pour voir le reste |
| Connecté | Liste complète, pagination 20/page |

## Architecture
- Fichier serveur : `src/app/rfq/page.tsx` (Server Component)
  - SSR des premiers RFQ pour le SEO
  - Détecte `isLoggedIn` via Supabase server client
  - Passe `initialRFQs`, `totalCount`, `isLoggedIn` au client
- Fichier client : `src/app/rfq/RFQClient.tsx` (Client Component)
  - Sidebar filtres + grille de cartes + pagination

## API utilisée
`GET /api/rfq` — paramètres : `q`, `type`, `actor_type`, `limit`, `page`

Note : les filtres budget/deadline/tags se font côté client sur les données fetchées (l'API ne les supporte pas nativement).

## Sidebar filtres
- Recherche texte full-text (debounce 300ms, paramètre `q`)
- Type : Tous / RFQ / RFI (radio, paramètre `type`)
- Région : Toutes / Wallonie / Flandre / Bruxelles-Capitale (radio, filtre client sur `location`)
- Type d'acteur ciblé : Tous + 7 types (radio, filtre client sur `target_actor_types[]`)
- Budget : input texte (filtre client sur `budget_range` contient la valeur)
- Deadline : date picker natif — "avant le" (filtre client sur `deadline`)
- Tags : input texte (filtre client — tag contenu dans `tags[]`)

## Carte RFQ
- Titre + badge type (RFQ / RFI) coloré
- Organisation publiante : logo (fallback emoji 🏢), nom, badge ✓ Vérifié, ville
- Description : line-clamp-5 (4-5 lignes)
- Chips : Budget · Deadline · Localisation
- Tous les tags (chip style)
- Bouton "Voir le détail →" → `/rfq/[id]` (lien actif, 404 jusqu'à F8)

## Comportement non-connecté
- 12 premières cartes visibles
- Bloc opaque en bas : "X appels d'offres supplémentaires · S'inscrire pour voir" → `/register`

## Pagination (connecté)
- 20 RFQ par page
- Boutons Précédent / Suivant

## Design system
- Même fond `#080C14`, classes `.card`, `.btn-primary`, `.btn-secondary`
- Badge RFQ : `text-yellow-500 border-yellow-500/30 bg-yellow-500/8`
- Badge RFI : `text-blue-400 border-blue-400/30 bg-blue-400/8`
- Tailwind vanilla uniquement
