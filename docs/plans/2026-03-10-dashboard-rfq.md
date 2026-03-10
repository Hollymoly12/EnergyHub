# Dashboard RFQ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer `/dashboard/rfq` — page de gestion des RFQs de l'organisation connectée avec cards, onglets de statut, stats et actions (publier, clôturer, supprimer).

**Architecture:** Server Component pour le fetch initial (pattern identique à `dashboard/profile/page.tsx`). Server Actions dans `actions.ts` pour les mutations. Client Component `RFQDashboardCard.tsx` pour les interactions UI (onglets, menus d'actions, confirmation de suppression).

**Tech Stack:** Next.js 15 App Router, Supabase server client, Server Actions (`"use server"`), Tailwind CSS, classes custom `.card` `.btn-primary` `.btn-secondary` `.input` `.label`

---

## Contexte important

- **Couleurs Tailwind disponibles** : `bg-slate-900`, `border-slate-800`, `text-yellow-500`, `text-green-400`, `text-red-400`, `text-blue-400` — PAS de `bg-surface-*` ni `text-brand-*`
- **Classes custom globals.css** : `.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`
- **Pattern server page** : voir `src/app/dashboard/profile/page.tsx` (getUser → getMember → render)
- **rfq_status enum** : `'draft' | 'published' | 'responses_open' | 'under_review' | 'closed' | 'cancelled'`
- **Stats dans rfqs table** : `views_count INT`, `responses_count INT`, `ai_summary TEXT`, `ai_matched_at TIMESTAMPTZ`
- **Transitions autorisées** : draft→published, published→closed
- **Suppression** : uniquement si status=draft

---

### Task 1: Server Actions

**Files:**
- Create: `src/app/dashboard/rfq/actions.ts`

**Step 1: Créer le fichier avec les deux actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRFQStatus(rfqId: string, newStatus: "published" | "closed") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Vérifier ownership
  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("rfqs")
    .update({
      status: newStatus,
      ...(newStatus === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", rfqId)
    .eq("organization_id", member.organization_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rfq");
}

export async function deleteRFQ(rfqId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("rfqs")
    .delete()
    .eq("id", rfqId)
    .eq("organization_id", member.organization_id)
    .eq("status", "draft");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rfq");
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/rfq/actions.ts
git commit -m "feat: server actions updateRFQStatus + deleteRFQ"
```

---

### Task 2: RFQDashboardCard — Client Component

**Files:**
- Create: `src/app/dashboard/rfq/RFQDashboardCard.tsx`

**Step 1: Créer le composant**

```typescript
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateRFQStatus, deleteRFQ } from "./actions";

interface RFQ {
  id: string;
  title: string;
  type: string;
  description: string | null;
  budget_range: string | null;
  deadline: string | null;
  location: string | null;
  status: string;
  views_count: number;
  responses_count: number;
  ai_summary: string | null;
  ai_matched_at: string | null;
  published_at: string | null;
  created_at: string;
  tags: string[];
  target_actor_types: string[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:           { label: "Brouillon",       color: "text-slate-400 border-slate-600 bg-slate-800" },
  published:       { label: "Publié",           color: "text-green-400 border-green-400/30 bg-green-400/10" },
  responses_open:  { label: "Réponses ouvertes", color: "text-green-400 border-green-400/30 bg-green-400/10" },
  under_review:    { label: "En révision",      color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  closed:          { label: "Clôturé",          color: "text-slate-500 border-slate-700 bg-slate-800" },
  cancelled:       { label: "Annulé",           color: "text-red-400 border-red-400/30 bg-red-400/10" },
};

const ACTOR_LABELS: Record<string, string> = {
  industrial: "Industriel", installer: "Installateur",
  software_editor: "Éditeur logiciel", investor: "Investisseur",
  energy_provider: "Fournisseur d'énergie", esco: "ESCO", greentech: "GreenTech",
};

export default function RFQDashboardCard({ rfq }: { rfq: RFQ }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft;
  const isDraft = rfq.status === "draft";
  const isPublished = rfq.status === "published" || rfq.status === "responses_open";
  const isAIAnalyzed = !!rfq.ai_summary || !!rfq.ai_matched_at;

  const deadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })
    : null;

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      try { await updateRFQStatus(rfq.id, "published"); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleClose() {
    setError(null);
    startTransition(async () => {
      try { await updateRFQStatus(rfq.id, "closed"); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setError(null);
    startTransition(async () => {
      try { await deleteRFQ(rfq.id); }
      catch (e) { setError((e as Error).message); setConfirmDelete(false); }
    });
  }

  return (
    <div className={`card p-5 flex flex-col gap-3 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header: type + statut */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
          {rfq.type.toUpperCase()}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-white text-sm leading-snug">{rfq.title}</h3>

      {/* Description */}
      {rfq.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{rfq.description}</p>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {rfq.budget_range && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            💰 {rfq.budget_range}
          </span>
        )}
        {deadline && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📅 {deadline}
          </span>
        )}
        {rfq.location && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📍 {rfq.location}
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
        <span>👁 {rfq.views_count} vues</span>
        <span>📬 {rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}</span>
        <span className={isAIAnalyzed ? "text-green-400" : "text-slate-600"}>
          🤖 {isAIAnalyzed ? "Analysé" : "En attente"}
        </span>
      </div>

      {/* Erreur */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link href={`/rfq/${rfq.id}`} className="btn-secondary text-xs py-2 w-full text-center">
          Voir le détail →
        </Link>
        {isDraft && (
          <button onClick={handlePublish} className="btn-primary text-xs py-2 w-full">
            Publier
          </button>
        )}
        {isPublished && (
          <button
            onClick={handleClose}
            className="text-xs py-2 w-full rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Clôturer
          </button>
        )}
        {isDraft && (
          <button
            onClick={handleDelete}
            className={`text-xs py-1.5 w-full transition-colors ${
              confirmDelete
                ? "text-red-400 hover:text-red-300 font-semibold"
                : "text-slate-600 hover:text-red-400"
            }`}
          >
            {confirmDelete ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        )}
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/rfq/RFQDashboardCard.tsx
git commit -m "feat: RFQDashboardCard client component with status actions"
```

---

### Task 3: Page Server Component

**Files:**
- Create: `src/app/dashboard/rfq/page.tsx`

**Step 1: Créer la page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RFQDashboardClient from "./RFQDashboardClient";

export default async function DashboardRFQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/login");

  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, title, type, description, budget_range, deadline, location, status, views_count, responses_count, ai_summary, ai_matched_at, published_at, created_at, tags, target_actor_types")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mes appels d'offres</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rfqs?.length ?? 0} RFQ{(rfqs?.length ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/rfq/create" className="btn-primary">
          + Publier un RFQ
        </Link>
      </div>

      <RFQDashboardClient rfqs={rfqs ?? []} />
    </div>
  );
}
```

**Note:** Cette page utilise `RFQDashboardClient` (Task 4) pour les onglets + grille.

**Step 2: Commit partiel (actions + card + page)**

```bash
git add src/app/dashboard/rfq/page.tsx
git commit -m "feat: dashboard rfq server page"
```

---

### Task 4: RFQDashboardClient — Onglets + Grille

**Files:**
- Create: `src/app/dashboard/rfq/RFQDashboardClient.tsx`

**Step 1: Créer le composant**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import RFQDashboardCard from "./RFQDashboardCard";

interface RFQ {
  id: string;
  title: string;
  type: string;
  description: string | null;
  budget_range: string | null;
  deadline: string | null;
  location: string | null;
  status: string;
  views_count: number;
  responses_count: number;
  ai_summary: string | null;
  ai_matched_at: string | null;
  published_at: string | null;
  created_at: string;
  tags: string[];
  target_actor_types: string[];
}

const TABS = [
  { id: "all",       label: "Tous" },
  { id: "published", label: "Publiés" },
  { id: "draft",     label: "Brouillons" },
  { id: "closed",    label: "Clôturés" },
] as const;

function matchesTab(rfq: RFQ, tab: string) {
  if (tab === "all") return true;
  if (tab === "published") return rfq.status === "published" || rfq.status === "responses_open" || rfq.status === "under_review";
  if (tab === "closed") return rfq.status === "closed" || rfq.status === "cancelled";
  return rfq.status === tab;
}

export default function RFQDashboardClient({ rfqs }: { rfqs: RFQ[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = rfqs.filter(r => matchesTab(r, activeTab));

  const counts = {
    all: rfqs.length,
    published: rfqs.filter(r => matchesTab(r, "published")).length,
    draft: rfqs.filter(r => r.status === "draft").length,
    closed: rfqs.filter(r => matchesTab(r, "closed")).length,
  };

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map(tab => (
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

      {/* Grille */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rfq => (
            <RFQDashboardCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-4">📋</div>
          <p className="mb-4">
            {activeTab === "all"
              ? "Aucun appel d'offres pour le moment"
              : `Aucun RFQ dans l'onglet "${TABS.find(t => t.id === activeTab)?.label}"`}
          </p>
          {activeTab === "all" && (
            <Link href="/rfq/create" className="btn-primary text-sm">
              Publier mon premier RFQ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit final**

```bash
git add src/app/dashboard/rfq/RFQDashboardClient.tsx
git commit -m "feat: F6 /dashboard/rfq complete — cards, tabs, status actions"
```

---

### Task 5: Ajouter le lien dans la sidebar

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Lire le fichier**

Lire `src/app/dashboard/layout.tsx` pour trouver les nav links existants.

**Step 2: Ajouter le lien RFQ**

Trouver le bloc de navigation et ajouter un lien vers `/dashboard/rfq`. Le label sera "Mes RFQs" avec une icône 📋. Le placer après le lien Dashboard (page principale) et avant les autres sections.

**Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: add /dashboard/rfq link to sidebar"
```

---

### Task 6: Vérification finale

**Step 1: Démarrer le serveur**

```bash
npm run dev
```

**Step 2: Vérifier**

- [ ] Naviguer vers `/dashboard/rfq` — page s'affiche sans erreur
- [ ] Onglets "Tous / Publiés / Brouillons / Clôturés" filtrent correctement
- [ ] Bouton "Publier" sur un draft → status passe à published, revalidation OK
- [ ] Bouton "Clôturer" sur un published → status passe à closed
- [ ] Bouton "Supprimer" sur un draft → double confirmation → RFQ supprimé
- [ ] Lien sidebar "/dashboard/rfq" visible et actif
- [ ] État vide affiché avec CTA si aucun RFQ

**Step 3: Commit final**

```bash
git add .
git commit -m "feat: F6 /dashboard/rfq — gestion RFQs organisation"
```
