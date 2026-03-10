# Dashboard Matches Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer `/dashboard/matches` — page affichant les correspondances IA de l'organisation (dans les deux sens) avec déclenchement manuel du matching si la table est vide.

**Architecture:** Server Component pour le fetch des matchs existants. Client Component `MatchesClient.tsx` pour onglets + bouton "Lancer le matching IA". API route `/api/agents/matching` (POST) qui appelle `runMatchingAgent` depuis `agents.ts` (sauvegarde automatique en BDD).

**Tech Stack:** Next.js 15 App Router, Supabase server client, `runMatchingAgent` depuis `@/lib/claude/agents`, Tailwind CSS, classes custom `.card` `.btn-primary` `.btn-secondary`

---

## Contexte important

- **Couleurs Tailwind disponibles** : `bg-slate-900`, `border-slate-800`, `text-yellow-500`, `text-green-400`, `text-red-400`, `text-blue-400` — PAS de `bg-surface-*` ni `text-brand-*`
- **Classes custom globals.css** : `.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`
- **Pattern server page** : voir `src/app/dashboard/profile/page.tsx` (getUser → getMember → redirect si null)
- **Pattern API route agent** : voir `src/app/api/agents/onboarding/route.ts`
- **Agent matching** : `runMatchingAgent` dans `src/lib/claude/agents.ts` — sauvegarde les matchs ≥60 en BDD via upsert sur `(source_org_id, target_org_id)`
- **Table matches** : `source_org_id`, `target_org_id`, `rfq_id` (nullable), `match_score` (0-100), `match_reasons TEXT[]`, `is_viewed BOOLEAN`, `created_at`
- **Lien sidebar** déjà présent : `{ href: "/dashboard/matches", icon: "🧠", label: "Mes matchs" }`

---

### Task 1: API route /api/agents/matching

**Files:**
- Create: `src/app/api/agents/matching/route.ts`

**Step 1: Créer la route**

```typescript
// src/app/api/agents/matching/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMatchingAgent } from "@/lib/claude/agents";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Récupérer l'org de l'user avec toutes ses données
    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(*)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const sourceOrg = member.organizations as Record<string, unknown>;
    const sourceOrgId = member.organization_id as string;

    // Fetch candidats : toutes les orgs sauf la sienne (limit 20)
    const { data: candidates } = await supabase
      .from("organizations")
      .select("*")
      .neq("id", sourceOrgId)
      .limit(20);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: true, matchesCreated: 0 });
    }

    // Déclencher l'agent matching (sauvegarde les matchs ≥60 en BDD)
    const result = await runMatchingAgent({
      sourceOrgId,
      sourceOrgData: sourceOrg,
      candidateOrgs: candidates,
      context: "networking",
    });

    const matchesCreated = result.output?.matches?.length ?? 0;
    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Matching agent error:", error);
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/agents/matching/route.ts
git commit -m "feat: POST /api/agents/matching route"
```

---

### Task 2: Page Server Component

**Files:**
- Create: `src/app/dashboard/matches/page.tsx`

**Step 1: Créer la page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchesClient from "./MatchesClient";

interface MatchWithOrg {
  id: string;
  match_score: number;
  match_reasons: string[];
  is_viewed: boolean;
  rfq_id: string | null;
  created_at: string;
  direction: "sent" | "received";
  matched_org: {
    id: string;
    name: string;
    slug: string;
    actor_type: string;
    logo_url: string | null;
    city: string | null;
    is_verified: boolean;
  };
  rfq_title?: string | null;
}

export default async function DashboardMatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/login");

  const orgId = member.organization_id;

  // Matchs initiés (source)
  const { data: sentMatches } = await supabase
    .from("matches")
    .select(`
      id, match_score, match_reasons, is_viewed, rfq_id, created_at,
      target_org:organizations!matches_target_org_id_fkey(id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("source_org_id", orgId)
    .order("match_score", { ascending: false });

  // Matchs reçus (target)
  const { data: receivedMatches } = await supabase
    .from("matches")
    .select(`
      id, match_score, match_reasons, is_viewed, rfq_id, created_at,
      source_org:organizations!matches_source_org_id_fkey(id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("target_org_id", orgId)
    .order("match_score", { ascending: false });

  // Normaliser en un seul array
  const allMatches: MatchWithOrg[] = [
    ...(sentMatches || []).map((m) => ({
      id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons || [],
      is_viewed: m.is_viewed,
      rfq_id: m.rfq_id,
      created_at: m.created_at,
      direction: "sent" as const,
      matched_org: m.target_org as MatchWithOrg["matched_org"],
    })),
    ...(receivedMatches || []).map((m) => ({
      id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons || [],
      is_viewed: m.is_viewed,
      rfq_id: m.rfq_id,
      created_at: m.created_at,
      direction: "received" as const,
      matched_org: m.source_org as MatchWithOrg["matched_org"],
    })),
  ].sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mes matchs IA</h1>
          <p className="text-slate-500 text-sm mt-1">
            {allMatches.length} correspondance{allMatches.length > 1 ? "s" : ""} trouvée{allMatches.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <MatchesClient matches={allMatches} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/matches/page.tsx
git commit -m "feat: dashboard matches server page"
```

---

### Task 3: MatchesClient — onglets + grille + bouton IA

**Files:**
- Create: `src/app/dashboard/matches/MatchesClient.tsx`

**Step 1: Créer le composant**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MatchedOrg {
  id: string;
  name: string;
  slug: string;
  actor_type: string;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean;
}

interface Match {
  id: string;
  match_score: number;
  match_reasons: string[];
  is_viewed: boolean;
  rfq_id: string | null;
  created_at: string;
  direction: "sent" | "received";
  matched_org: MatchedOrg;
  rfq_title?: string | null;
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

const TABS = [
  { id: "all",      label: "Tous" },
  { id: "received", label: "Reçus" },
  { id: "sent",     label: "Initiés" },
  { id: "unread",   label: "Non vus" },
] as const;

function scoreColor(score: number) {
  if (score >= 70) return "text-green-400 border-green-400/30 bg-green-400/10";
  if (score >= 40) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
  return "text-red-400 border-red-400/30 bg-red-400/10";
}

function MatchCard({ match }: { match: Match }) {
  const org = match.matched_org;
  const actorInfo = ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" };

  return (
    <div className={`card p-5 flex flex-col gap-3 ${!match.is_viewed ? "border-yellow-500/20" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
              : actorInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">
              {org.name}
              {org.is_verified && <span className="text-green-400 ml-1 text-xs">✓</span>}
            </div>
            <div className="text-[10px] text-slate-500">{actorInfo.icon} {actorInfo.label}</div>
            {org.city && <div className="text-[10px] text-slate-600">📍 {org.city}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor(match.match_score)}`}>
            {match.match_score}%
          </span>
          {!match.is_viewed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
              Nouveau
            </span>
          )}
        </div>
      </div>

      {/* Direction */}
      <div className="text-[10px] text-slate-600">
        {match.direction === "received" ? "↙ Match reçu" : "↗ Match initié"}
        {match.rfq_title && <span className="ml-2 text-slate-500">· RFQ : {match.rfq_title}</span>}
        {!match.rfq_id && <span className="ml-2">· Networking général</span>}
      </div>

      {/* Raisons */}
      {match.match_reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.match_reasons.slice(0, 3).map((reason, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/directory/${org.slug}`}
          className="btn-secondary text-xs py-2 flex-1 text-center"
        >
          Voir le profil →
        </Link>
        <Link
          href="/dashboard/messages"
          className="btn-primary text-xs py-2 flex-1 text-center"
        >
          Contacter
        </Link>
      </div>
    </div>
  );
}

export default function MatchesClient({ matches }: { matches: Match[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = matches.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !m.is_viewed;
    return m.direction === activeTab;
  });

  const counts = {
    all: matches.length,
    received: matches.filter((m) => m.direction === "received").length,
    sent: matches.filter((m) => m.direction === "sent").length,
    unread: matches.filter((m) => !m.is_viewed).length,
  };

  function handleRunMatching() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/matching", { method: "POST" });
        if (!res.ok) throw new Error("Erreur lors du matching");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative pb-3 ${
              activeTab === tab.id
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            {counts[tab.id as keyof typeof counts] > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-yellow-500/20 text-yellow-500" : "bg-slate-800 text-slate-500"
              }`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grille ou état vide */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-4">🧠</div>
          <p className="text-white font-semibold mb-2">
            {activeTab === "all" ? "Aucun match IA pour le moment" : `Aucun match dans cet onglet`}
          </p>
          <p className="text-slate-500 text-sm mb-6">
            {activeTab === "all"
              ? "Lancez le matching pour trouver vos meilleures correspondances parmi les acteurs de la plateforme."
              : "Essayez un autre onglet ou lancez le matching IA."}
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {isPending ? "Analyse en cours..." : "🤖 Lancer le matching IA"}
          </button>
        </div>
      )}

      {/* Bouton relancer si des matchs existent déjà */}
      {filtered.length > 0 && activeTab === "all" && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            {isPending ? "Analyse en cours..." : "↺ Relancer le matching IA"}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/matches/MatchesClient.tsx
git commit -m "feat: MatchesClient tabs, grid, and AI trigger button"
```

---

### Task 4: Vérification TypeScript + build

**Step 1: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "dashboard/matches|api/agents/matching"
```

Expected: aucune sortie (pas d'erreurs)

**Step 2: Si erreurs TypeScript sur les foreign key joins Supabase**

Les joins Supabase avec foreign key explicite (`organizations!matches_target_org_id_fkey`) peuvent nécessiter un cast. Si TypeScript se plaint, remplacer les deux selects par :

```typescript
// Pour sentMatches
.select("id, match_score, match_reasons, is_viewed, rfq_id, created_at, target_org_id")

// Puis fetch séparé des orgs
```

Mais d'abord tester avec la version inline — Supabase TypeScript types gèrent généralement ces joins.

**Step 3: Vérifier le build**

```bash
npm run build 2>&1 | grep -E "dashboard/matches|agents/matching|error"
```

Expected: les nouvelles routes compilent sans erreur (l'erreur Stripe pre-existante est ignorée)

**Step 4: Commit final si corrections nécessaires**

```bash
git add -A
git commit -m "fix: dashboard matches TypeScript corrections"
```

---

### Task 5: Vérification manuelle

**Step 1: Démarrer le serveur**

```bash
npm run dev
```

**Step 2: Checklist**

- [ ] `/dashboard/matches` s'affiche sans erreur
- [ ] Onglets Tous / Reçus / Initiés / Non vus sont présents
- [ ] Si table matches vide : état vide + bouton "Lancer le matching IA" visible
- [ ] Bouton IA déclenche un spinner "Analyse en cours..."
- [ ] Après matching : cards apparaissent avec score coloré + raisons + boutons
- [ ] "Voir le profil →" pointe vers `/directory/[slug]`
- [ ] "Contacter" pointe vers `/dashboard/messages`

**Step 3: Commit final**

```bash
git add .
git commit -m "feat: F7 /dashboard/matches complete"
```
