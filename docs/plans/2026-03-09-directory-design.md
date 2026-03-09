# F2 — Annuaire des acteurs (`/directory`)

## Contexte
Marketplace B2B de la transition énergétique belge. L'annuaire est la vitrine publique des 7 types d'acteurs inscrits sur EnergyHub.

## Décisions clés
- Page **publique** : accessible sans connexion
- Non-connectés : **12 cartes visibles**, puis CTA d'inscription pour voir le reste
- Page profil `/directory/[slug]` : visible mais **coordonnées floutées** si non connecté
- Layout : **sidebar filtres + grille 3 colonnes** (approche A)
- Pas de nouvelle API — `/api/actors` existante couvre tous les besoins

## Pages & composants

### `/directory/page.tsx` (Server Component)
- Fetch SSR des 12 premiers acteurs pour le SEO
- Détecte si l'utilisateur est connecté (Supabase server client)
- Passe `initialActors`, `isLoggedIn`, `totalCount` au client component

### `DirectoryClient.tsx` (Client Component)
- Barre de recherche full-text (debounce 300ms)
- Sidebar filtres :
  - Type d'acteur (radio : Tous / Industriel / Installateur / Éditeur logiciel / Investisseur / Fournisseur / ESCO / GreenTech)
  - Région (radio : Toutes / Wallonie / Flandre / Bruxelles-Capitale)
  - Vérifiés seulement (checkbox)
- Grille 3 colonnes de cartes
- Si non connecté : 12 cartes + bloc CTA opaque (compte des acteurs restants)
- Si connecté : pagination classique (24/page)
- Tri : rating par défaut (Pro/Enterprise boostés en premier)

### Carte acteur
- Logo (fallback emoji 🏢) + nom + badge type acteur + badge ✓ Vérifié
- Ville · Région
- Accroche courte (short_description, 160 chars max)
- Tags (3 max, chip style)
- Rating étoiles + nombre d'avis
- Clic → `/directory/[slug]`

### `/directory/[slug]/page.tsx` (Server Component)
- Fetch par slug, 404 si introuvable
- Incrémente `profile_views` en arrière-plan
- Passe `org` + `isLoggedIn` au composant de rendu

### Layout page profil
- Cover image (fallback gradient)
- Logo + nom + badges + rating
- Description complète
- Tags / Technologies / Certifications (chips)
- Taille équipe, CA, année fondation
- Colonne contact (site web, téléphone, LinkedIn)
  - **Si non connecté** : infos floutées + overlay "Voir les coordonnées → S'inscrire"
  - **Si connecté** : infos visibles + bouton "Contacter" (désactivé jusqu'à F9 messagerie)

## API utilisée
`GET /api/actors` — paramètres : `q`, `type`, `region`, `verified`, `limit`, `page`, `sort`

## Seuils d'accès
| Utilisateur | `/directory` | `/directory/[slug]` |
|-------------|-------------|---------------------|
| Non connecté | 12 acteurs + CTA | Profil visible, contact flouté |
| Connecté (Free) | Tout + pagination | Tout visible |
| Connecté (Pro) | Tout + pagination | Tout visible |
