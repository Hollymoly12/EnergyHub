# F2 — Directory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `/directory` (annuaire public avec filtres) et `/directory/[slug]` (profil organisation) avec accès limité aux visiteurs non connectés.

**Architecture:** Server component pour le SSR initial (SEO), client component `DirectoryClient` pour la recherche/filtres interactifs via l'API `/api/actors` existante. La page profil est un server component pur.

**Tech Stack:** Next.js 15 App Router, Supabase (server client), Tailwind CSS, classes custom globals.css (`.card`, `.input`, `.btn-primary`, `.btn-secondary`, `.label`)

**Couleurs réelles Tailwind** (le config est vanilla, pas de tokens custom) :
- Fond : `bg-[#080C14]`, cartes : `bg-slate-900 border-slate-800`
- Accent : `text-yellow-500`, `bg-yellow-500`
- Texte : `text-white`, `text-slate-400`, `text-slate-500`

---

### Task 1 : Page `/directory` — Server Component

**Files:**
- Create: `src/app/directory/page.tsx`

**Step 1: Créer le fichier avec fetch SSR initial**

```tsx
import { createClient } from "@/lib/supabase/server";
import DirectoryClient from "./DirectoryClient";

export const metadata = {
  title: "Annuaire — EnergyHub",
  description: "Trouvez les acteurs de la transition énergétique belge.",
};

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch initial SSR (pour SEO)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/actors?limit=24&sort=rating`,
    { cache: "no-store" }
  );
  const { actors, total } = await res.json();

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">
            Annuaire
          </div>
          <h1 className="text-3xl font-bold text-white">
            Les acteurs de la transition énergétique
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {total} organisations référencées sur EnergyHub
          </p>
        </div>

        <DirectoryClient
          initialActors={actors || []}
          totalCount={total || 0}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
```

**Step 2: Vérifier que le fichier compile (pas d'erreur TypeScript)**

```bash
# Dans le dossier du projet
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/app/directory/page.tsx
git commit -m "feat: F2 directory server page with SSR initial fetch"
```

---

### Task 2 : `DirectoryClient` — Filtres, recherche, grille

**Files:**
- Create: `src/app/directory/DirectoryClient.tsx`

**Step 1: Créer le composant avec les types**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Actor {
  id: string;
  name: string;
  slug: string;
  actor_type: string;
  short_description: string | null;
  city: string | null;
  region: string | null;
  logo_url: string | null;
  tags: string[];
  is_verified: boolean;
  subscription_plan: string;
  rating: number;
  reviews_count: number;
}

interface Props {
  initialActors: Actor[];
  totalCount: number;
  isLoggedIn: boolean;
}

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

const ACTOR_TYPES = Object.entries(ACTOR_LABELS);
const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];
const PUBLIC_LIMIT = 12; // cartes visibles sans connexion
```

**Step 2: Ajouter le state et la fonction de fetch**

```tsx
export default function DirectoryClient({ initialActors, totalCount, isLoggedIn }: Props) {
  const [actors, setActors] = useState<Actor[]>(initialActors);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");
  const [region, setRegion] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(0);

  const fetchActors = useCallback(async (params: {
    q?: string; type?: string; region?: string;
    verified?: boolean; page?: number;
  }) => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.type) sp.set("type", params.type);
    if (params.region) sp.set("region", params.region);
    if (params.verified) sp.set("verified", "true");
    sp.set("limit", "24");
    sp.set("page", String(params.page || 0));
    sp.set("sort", "rating");

    const res = await fetch(`/api/actors?${sp}`);
    const data = await res.json();
    setActors(data.actors || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, []);

  // Debounce recherche texte
  useEffect(() => {
    const t = setTimeout(() => {
      fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: 0 });
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, actorType, region, verifiedOnly, fetchActors]);
```

**Step 3: Ajouter le JSX — sidebar + grille**

```tsx
  // Acteurs à afficher (limités pour non-connectés)
  const visibleActors = isLoggedIn ? actors : actors.slice(0, PUBLIC_LIMIT);
  const hiddenCount = isLoggedIn ? 0 : Math.max(0, total - PUBLIC_LIMIT);

  return (
    <div className="flex gap-6 items-start">

      {/* ── Sidebar filtres ── */}
      <aside className="w-60 shrink-0 sticky top-8">
        <div className="card p-5 space-y-6">

          {/* Recherche */}
          <div>
            <label className="label">Recherche</label>
            <input
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, ville, technologie..."
            />
          </div>

          {/* Type d'acteur */}
          <div>
            <label className="label">Type d'acteur</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="type" checked={actorType === ""}
                  onChange={() => setActorType("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                  Tous
                </span>
              </label>
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="type" checked={actorType === value}
                    onChange={() => setActorType(value)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Région */}
          <div>
            <label className="label">Région</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="region" checked={region === ""}
                  onChange={() => setRegion("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                  Toutes
                </span>
              </label>
              {REGIONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="region" checked={region === r}
                    onChange={() => setRegion(r)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                    {r}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Vérifiés */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="accent-yellow-500" />
            <span className="text-sm text-slate-400">Vérifiés uniquement</span>
          </label>

          {/* Reset */}
          {(search || actorType || region || verifiedOnly) && (
            <button
              onClick={() => { setSearch(""); setActorType(""); setRegion(""); setVerifiedOnly(false); }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              ↺ Réinitialiser les filtres
            </button>
          )}
        </div>
      </aside>

      {/* ── Grille ── */}
      <div className="flex-1 min-w-0">

        {/* Résultats count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            {loading ? "Recherche..." : `${total} acteur${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Grille cartes */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${loading ? "opacity-50" : ""} transition-opacity`}>
          {visibleActors.map(actor => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </div>

        {/* CTA non-connectés */}
        {!isLoggedIn && hiddenCount > 0 && (
          <div className="mt-6 card p-8 text-center border-yellow-500/20 bg-yellow-500/3">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-white font-semibold mb-1">
              +{hiddenCount} acteur{hiddenCount > 1 ? "s" : ""} disponible{hiddenCount > 1 ? "s" : ""}
            </div>
            <div className="text-slate-500 text-sm mb-4">
              Inscrivez-vous gratuitement pour accéder à l'annuaire complet
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/register" className="btn-primary">
                S'inscrire gratuitement →
              </a>
              <a href="/login" className="btn-secondary">
                Se connecter
              </a>
            </div>
          </div>
        )}

        {/* Pagination (connectés) */}
        {isLoggedIn && total > 24 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={page === 0}
              onClick={() => { const p = page - 1; setPage(p); fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: p }); }}
              className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-500 flex items-center px-4">
              Page {page + 1} / {Math.ceil(total / 24)}
            </span>
            <button
              disabled={(page + 1) * 24 >= total}
              onClick={() => { const p = page + 1; setPage(p); fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: p }); }}
              className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Ajouter le composant `ActorCard`** (dans le même fichier, avant `DirectoryClient`)

```tsx
function ActorCard({ actor }: { actor: Actor }) {
  const typeInfo = ACTOR_LABELS[actor.actor_type] || { label: actor.actor_type, icon: "🏢" };

  return (
    <Link href={`/directory/${actor.slug}`} className="card p-5 hover:border-slate-700 transition-all group block">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {actor.logo_url
            ? <img src={actor.logo_url} alt="" className="w-full h-full object-contain" />
            : typeInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
              {actor.name}
            </span>
            {actor.is_verified && (
              <span className="text-[10px] text-green-400 font-bold shrink-0">✓</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {typeInfo.icon} {typeInfo.label}
            {actor.city && ` · ${actor.city}`}
          </div>
        </div>
      </div>

      {/* Description */}
      {actor.short_description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
          {actor.short_description}
        </p>
      )}

      {/* Tags */}
      {actor.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {actor.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tag}
            </span>
          ))}
          {actor.tags.length > 3 && (
            <span className="text-[10px] text-slate-600">+{actor.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} className={`text-[10px] ${s <= Math.round(actor.rating) ? "text-yellow-500" : "text-slate-700"}`}>★</span>
          ))}
          {actor.reviews_count > 0 && (
            <span className="text-[10px] text-slate-600 ml-1">({actor.reviews_count})</span>
          )}
        </div>
        {actor.subscription_plan === "pro" && (
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">PRO</span>
        )}
        {actor.subscription_plan === "enterprise" && (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">ENTERPRISE</span>
        )}
      </div>
    </Link>
  );
}
```

**Step 5: Vérifier le typage**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 6: Commit**

```bash
git add src/app/directory/DirectoryClient.tsx
git commit -m "feat: F2 DirectoryClient with filters, search, CTA for guests"
```

---

### Task 3 : Page profil `/directory/[slug]`

**Files:**
- Create: `src/app/directory/[slug]/page.tsx`

**Step 1: Créer la page server component**

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

export default async function ActorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Incrémenter les vues en arrière-plan
  supabase
    .from("organizations")
    .update({ profile_views: (org.profile_views || 0) + 1 })
    .eq("id", org.id)
    .then(() => {});

  const typeInfo = ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" };
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Retour */}
        <Link href="/directory" className="text-sm text-slate-500 hover:text-white transition-colors inline-flex items-center gap-1.5 mb-6">
          ← Retour à l'annuaire
        </Link>

        {/* Cover */}
        <div className="card overflow-hidden mb-6">
          <div
            className="h-32 bg-gradient-to-r from-slate-800 to-slate-900"
            style={org.cover_image_url ? {
              backgroundImage: `url(${org.cover_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                {org.logo_url
                  ? <img src={org.logo_url} alt="" className="w-full h-full object-contain" />
                  : typeInfo.icon}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-white">{org.name}</h1>
                  {org.is_verified && (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      ✓ Vérifié
                    </span>
                  )}
                  {org.subscription_plan === "pro" && (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {typeInfo.icon} {typeInfo.label}
                  {org.city && ` · ${org.city}`}
                  {org.region && `, ${org.region}`}
                  {org.founded_year && ` · Fondée en ${org.founded_year}`}
                </div>
              </div>
            </div>

            {/* Rating */}
            {org.reviews_count > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(org.rating) ? "text-yellow-500" : "text-slate-700"}`}>★</span>
                  ))}
                </div>
                <span className="text-sm text-slate-500">
                  {org.rating.toFixed(1)} ({org.reviews_count} avis)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            {org.description && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-white mb-3">À propos</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {org.description}
                </p>
              </div>
            )}

            {/* Tags & Technologies */}
            {((org.tags?.length > 0) || (org.technologies?.length > 0) || (org.certifications?.length > 0)) && (
              <div className="card p-6 space-y-4">
                {org.tags?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {org.technologies?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.technologies.map((tech: string) => (
                        <span key={tech} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {org.certifications?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.certifications.map((cert: string) => (
                        <span key={cert} className="text-xs px-3 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Infos entreprise */}
            {(org.team_size || org.annual_revenue) && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-white mb-3">Informations</h2>
                <div className="grid grid-cols-2 gap-4">
                  {org.team_size && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Équipe</div>
                      <div className="text-sm text-white">{org.team_size} employés</div>
                    </div>
                  )}
                  {org.annual_revenue && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Chiffre d'affaires</div>
                      <div className="text-sm text-white">{org.annual_revenue}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne contact */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Contact</h2>

              {isLoggedIn ? (
                <div className="space-y-3">
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <span>🌐</span>
                      <span className="truncate">{org.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>📞</span>
                      <span>{org.phone}</span>
                    </div>
                  )}
                  {org.linkedin_url && (
                    <a href={org.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <span>💼</span>
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {!org.website && !org.phone && !org.linkedin_url && (
                    <p className="text-xs text-slate-600">Aucune coordonnée renseignée</p>
                  )}
                  {/* Bouton contacter (sera branché F9 messagerie) */}
                  <button
                    disabled
                    className="btn-primary w-full mt-2 opacity-50 cursor-not-allowed"
                    title="Messagerie disponible prochainement"
                  >
                    ✉ Contacter
                  </button>
                </div>
              ) : (
                /* Non connecté — coordonnées floutées */
                <div className="relative">
                  <div className="space-y-3 select-none blur-sm pointer-events-none">
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>🌐</span><span>www.example.be</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>📞</span><span>+32 2 000 00 00</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>💼</span><span>LinkedIn</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-lg text-center p-3">
                    <div className="text-sm font-semibold text-white mb-1">🔒 Coordonnées masquées</div>
                    <div className="text-xs text-slate-500 mb-3">
                      Inscrivez-vous gratuitement pour voir les coordonnées
                    </div>
                    <a href="/register" className="btn-primary text-xs py-1.5 px-4">
                      S'inscrire →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Vues profil */}
            {org.profile_views > 0 && (
              <div className="text-xs text-slate-600 text-center">
                👁 {org.profile_views} vue{org.profile_views > 1 ? "s" : ""} du profil
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Vérifier le typage**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/app/directory/
git commit -m "feat: F2 /directory/[slug] profile page with contact gate"
```

---

### Task 4 : Push & vérification déploiement

**Step 1: Push final**

```bash
git push origin main
```

**Step 2: Vérifier le build Vercel**
- Aller sur vercel.com → dashboard → dernier déploiement
- Vérifier qu'il n'y a pas d'erreur TypeScript dans les logs

**Step 3: Tester les cas d'usage**
- Visiteur non connecté sur `/directory` → voit 12 cartes + CTA
- Visiteur non connecté sur `/directory/[slug]` → voit le profil, contact flouté
- Utilisateur connecté sur `/directory` → voit toutes les cartes + pagination
- Utilisateur connecté sur `/directory/[slug]` → voit les coordonnées

**Step 4: Commit final si corrections nécessaires**

```bash
git add .
git commit -m "fix: F2 directory post-deploy corrections"
git push origin main
```
