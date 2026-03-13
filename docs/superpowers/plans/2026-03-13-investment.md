# Investment Module Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full investment module — deal list, deal detail with interest expression, deal submission form, dashboard — with AI analysis on submission.

**Architecture:** API routes handle creation + interest; Server Components fetch and render; Client Components handle forms and modals. `analyzeDeal` agent is added to `src/lib/claude/agents.ts` and called synchronously from `POST /api/deals`. DB migration adds `deal_analysis` to the `agent_event_type` enum.

**Tech Stack:** Next.js 15 App Router, Supabase (server client), Anthropic SDK (claude-sonnet-4-20250514), Tailwind CSS + custom classes (`.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`)

---

## Chunk 1: DB Migration + analyzeDeal Agent

### Task 1: DB migration — add deal_analysis enum value

**Files:**
- Create: `supabase/migrations/20260313_agent_event_type_deal_analysis.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260313_agent_event_type_deal_analysis.sql
ALTER TYPE agent_event_type ADD VALUE IF NOT EXISTS 'deal_analysis';
```

- [ ] **Step 2: Apply migration (if using Supabase CLI locally)**

```bash
supabase db push
```

If no Supabase CLI, run the SQL directly in the Supabase dashboard SQL editor. Either way, verify the enum now includes `'deal_analysis'` by running:

```sql
SELECT unnest(enum_range(NULL::agent_event_type));
```

Expected: output includes `deal_analysis`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260313_agent_event_type_deal_analysis.sql
git commit -m "feat: migration — add deal_analysis to agent_event_type enum"
```

---

### Task 2: analyzeDeal agent in agents.ts

**Files:**
- Modify: `src/lib/claude/agents.ts` (append new export function)

- [ ] **Step 1: Append `analyzeDeal` to `src/lib/claude/agents.ts`**

Add the following at the end of the file (after `orchestrateNewRFQ`):

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// AGENT 5 — DEAL ANALYSTE
// Analyse les projets d'investissement soumis sur la plateforme
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeDeal(deal: {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  projectType?: string | null;
  location?: string | null;
  capacityMw?: number | null;
  fundingAmount?: number | null;
  fundingType?: string | null;
  series?: string | null;
  irrTarget?: number | null;
  durationYears?: number | null;
}): Promise<AgentResult> {
  const start = Date.now();

  const prompt = `Tu es un expert en finance d'entreprise et en énergie renouvelable. Analyse ce projet d'investissement soumis sur EnergyHub, la marketplace B2B de la transition énergétique belge.

Projet :
- Titre : ${deal.title}
- Description : ${deal.description}
- Type de projet : ${deal.projectType || "non précisé"}
- Localisation : ${deal.location || "non précisée"}
- Capacité : ${deal.capacityMw ? `${deal.capacityMw} MW` : "non précisée"}
- Montant recherché : ${deal.fundingAmount ? `${deal.fundingAmount.toLocaleString("fr-FR")} €` : "non précisé"}
- Type de financement : ${deal.fundingType || "non précisé"}
- Série : ${deal.series || "non précisée"}
- IRR cible : ${deal.irrTarget ? `${deal.irrTarget}%` : "non précisé"}
- Durée : ${deal.durationYears ? `${deal.durationYears} ans` : "non précisée"}

Fournis :
1. Un résumé exécutif (2-3 phrases, en français)
2. Une thèse d'investissement (pourquoi investir ou non dans ce projet, 2-3 phrases)
3. Un score de risque de 0 à 100 (0 = risque très faible, 100 = risque très élevé) basé sur la maturité du projet, la clarté des informations, la faisabilité technique et financière

Réponds UNIQUEMENT en JSON :
{
  "summary": "string (résumé exécutif)",
  "investment_thesis": "string (thèse d'investissement)",
  "risk_score": number
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const output = JSON.parse(clean) as {
      summary: string;
      investment_thesis: string;
      risk_score: number;
    };

    // Persister les résultats IA sur le deal
    const supabase = await createClient();
    await supabase
      .from("deals")
      .update({
        ai_summary: output.summary,
        ai_investment_thesis: output.investment_thesis,
        ai_risk_score: output.risk_score,
      })
      .eq("id", deal.id);

    const result: AgentResult = {
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      durationMs: Date.now() - start,
    };

    await logAgent({
      agentType: "deal_analysis",
      triggerEvent: "deal_submitted",
      organizationId: deal.organizationId,
      dealId: deal.id,
      inputData: { title: deal.title, fundingAmount: deal.fundingAmount },
      result,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "agents"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/claude/agents.ts
git commit -m "feat: analyzeDeal agent — AI summary, thesis, risk score for deals"
```

---

## Chunk 2: API Routes

### Task 3: POST /api/deals

**Files:**
- Create: `src/app/api/deals/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeDeal } from "@/lib/claude/agents";

export async function POST(req: NextRequest) {
  try {
    // Parse body first
    let body: {
      title?: string;
      description?: string;
      funding_amount?: number;
      project_type?: string;
      location?: string;
      capacity_mw?: number;
      funding_type?: string;
      series?: string;
      irr_target?: number;
      duration_years?: number;
      current_investors?: string;
      pitch_deck_url?: string;
      financial_model_url?: string;
      requires_nda?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, description, funding_amount } = body;
    if (!title?.trim() || !description?.trim() || !funding_amount) {
      return NextResponse.json(
        { error: "title, description et funding_amount sont requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (!member.organizations) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const orgId = member.organization_id as string;
    const now = new Date().toISOString();

    const { data: deal, error: insertError } = await supabase
      .from("deals")
      .insert({
        organization_id: orgId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        funding_amount,
        project_type: body.project_type || null,
        location: body.location || null,
        capacity_mw: body.capacity_mw || null,
        funding_type: body.funding_type || null,
        series: body.series || null,
        irr_target: body.irr_target || null,
        duration_years: body.duration_years || null,
        current_investors: body.current_investors || null,
        pitch_deck_url: body.pitch_deck_url || null,
        financial_model_url: body.financial_model_url || null,
        requires_nda: body.requires_nda ?? true,
        status: "published",
        published_at: now,
      })
      .select("id")
      .single();

    if (insertError || !deal) {
      console.error("Deal insert error:", insertError);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }

    // Agent IA synchrone (bloquant ~3-5s, acceptable pour une soumission)
    // A failed analysis does NOT fail the deal creation — deal is saved regardless
    try {
      await analyzeDeal({
        id: deal.id,
        organizationId: orgId,
        title: title.trim(),
        description: description.trim(),
        projectType: body.project_type,
        location: body.location,
        capacityMw: body.capacity_mw,
        fundingAmount: funding_amount,
        fundingType: body.funding_type,
        series: body.series,
        irrTarget: body.irr_target,
        durationYears: body.duration_years,
      });
    } catch (aiError) {
      console.error("analyzeDeal failed (deal still created):", aiError);
    }

    return NextResponse.json({ id: deal.id, success: true });
  } catch (error) {
    console.error("POST /api/deals error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "api/deals"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/api/deals/route.ts
git commit -m "feat: POST /api/deals — create deal + synchronous AI analysis"
```

---

### Task 4: POST /api/deal-interests

**Files:**
- Create: `src/app/api/deal-interests/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/deal-interests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let body: { dealId?: string; message?: string; ndaSigned?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { dealId, ndaSigned } = body;
    if (!dealId) return NextResponse.json({ error: "dealId is required" }, { status: 400 });
    if (typeof ndaSigned !== "boolean") {
      return NextResponse.json({ error: "ndaSigned must be a boolean" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    const orgId = member.organization_id as string;

    // Fetch deal to check requires_nda
    const { data: deal } = await supabase
      .from("deals")
      .select("id, requires_nda, organization_id, interests_count")
      .eq("id", dealId)
      .eq("status", "published")
      .single();
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    // Prevent self-interest
    if (deal.organization_id === orgId) {
      return NextResponse.json({ error: "Cannot express interest in your own deal" }, { status: 400 });
    }

    // NDA check
    if (deal.requires_nda && !ndaSigned) {
      return NextResponse.json({ error: "NDA signature is required for this deal" }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("deal_interests")
      .select("id")
      .eq("deal_id", dealId)
      .eq("investor_org_id", orgId)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Already expressed interest in this deal" }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from("deal_interests").insert({
      deal_id: dealId,
      investor_org_id: orgId,
      expressed_by: user.id,
      nda_signed: ndaSigned,
      nda_signed_at: ndaSigned ? now : null,
      message: body.message?.trim() || null,
      status: "interested",
    });
    if (insertError) {
      console.error("deal_interests insert error:", insertError);
      return NextResponse.json({ error: "Failed to save interest" }, { status: 500 });
    }

    // Increment interests_count atomically
    await supabase
      .from("deals")
      .update({ interests_count: (deal.interests_count ?? 0) + 1 })
      .eq("id", dealId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/deal-interests error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "deal-interests"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/api/deal-interests/route.ts
git commit -m "feat: POST /api/deal-interests — express interest with NDA support"
```

---

## Chunk 3: /investment list page + /investment/[id] + InterestButton

### Task 5: /investment/page.tsx — Deal list

**Files:**
- Create: `src/app/investment/page.tsx`
- Create: `src/app/investment/DealsClient.tsx`

- [ ] **Step 1: Create DealsClient.tsx (client-side filtering)**

```typescript
// src/app/investment/DealsClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  description: string;
  project_type: string | null;
  funding_amount: number | null;
  funding_type: string | null;
  irr_target: number | null;
  published_at: string | null;
  interests_count: number;
  organizations: { name: string; city: string | null } | null;
}

interface Props {
  deals: Deal[];
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  solar: "Solaire",
  wind: "Éolien",
  storage: "Stockage",
  efficiency: "Efficacité énergétique",
  other: "Autre",
};

const FUNDING_TYPE_LABELS: Record<string, string> = {
  equity: "Equity",
  debt: "Dette",
  convertible: "Convertible",
  grant: "Subvention",
};

export default function DealsClient({ deals }: Props) {
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [fundingTypeFilter, setFundingTypeFilter] = useState<string>("all");

  const filtered = deals.filter((d) => {
    if (projectTypeFilter !== "all" && d.project_type !== projectTypeFilter) return false;
    if (fundingTypeFilter !== "all" && d.funding_type !== fundingTypeFilter) return false;
    return true;
  });

  function formatAmount(amount: number | null): string {
    if (!amount) return "Montant non précisé";
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
    return `${amount.toLocaleString("fr-FR")} €`;
  }

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={projectTypeFilter}
          onChange={(e) => setProjectTypeFilter(e.target.value)}
          className="input text-sm"
        >
          <option value="all">Tous les types de projet</option>
          {Object.entries(PROJECT_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={fundingTypeFilter}
          onChange={(e) => setFundingTypeFilter(e.target.value)}
          className="input text-sm"
        >
          <option value="all">Tous les financements</option>
          {Object.entries(FUNDING_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-slate-500 text-sm self-center">
          {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">Aucun deal ne correspond aux filtres.</p>
          <p className="text-sm">Essayez d'élargir vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((deal) => (
            <div key={deal.id} className="card p-6 flex flex-col">
              {/* Type badge */}
              {deal.project_type && (
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3">
                  {PROJECT_TYPE_LABELS[deal.project_type] || deal.project_type}
                </span>
              )}
              <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">{deal.title}</h3>
              <p className="text-slate-400 text-sm mb-1">
                {deal.organizations?.name}
                {deal.organizations?.city ? ` · ${deal.organizations.city}` : ""}
              </p>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{deal.description}</p>

              <div className="flex flex-wrap gap-3 text-sm mb-4 mt-auto">
                <span className="text-green-400 font-medium">{formatAmount(deal.funding_amount)}</span>
                {deal.funding_type && (
                  <span className="text-slate-400">{FUNDING_TYPE_LABELS[deal.funding_type] || deal.funding_type}</span>
                )}
                {deal.irr_target && (
                  <span className="text-slate-400">IRR {deal.irr_target}%</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-xs">{deal.interests_count} intérêt{deal.interests_count !== 1 ? "s" : ""}</span>
                <Link href={`/investment/${deal.id}`} className="btn-primary text-sm px-4 py-2">
                  Voir le deal →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Create /investment/page.tsx**

```typescript
// src/app/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DealsClient from "./DealsClient";

export const metadata = {
  title: "Investissement — EnergyHub",
  description: "Découvrez les opportunités d'investissement dans la transition énergétique belge.",
};

export default async function InvestmentPage() {
  const supabase = await createClient();

  const { data: deals } = await supabase
    .from("deals")
    .select(`
      id, title, description, project_type, funding_amount, funding_type,
      irr_target, published_at, interests_count,
      organizations (name, city)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-3">
              Investissement
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Opportunités d&apos;investissement
            </h1>
            <p className="text-slate-400 max-w-xl">
              Découvrez les projets de la transition énergétique belge en recherche de financement.
            </p>
          </div>
          <Link href="/investment/submit" className="btn-primary whitespace-nowrap">
            Soumettre un deal +
          </Link>
        </div>

        <DealsClient deals={deals ?? []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "investment/page\|investment/DealsClient"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/investment/page.tsx src/app/investment/DealsClient.tsx
git commit -m "feat: /investment — deal list with client-side filters"
```

---

### Task 6: InterestButton.tsx

**Files:**
- Create: `src/app/investment/[id]/InterestButton.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/investment/[id]/InterestButton.tsx
"use client";

import { useState, useTransition } from "react";

interface Props {
  dealId: string;
  requiresNda: boolean;
  alreadyExpressed: boolean;
}

export default function InterestButton({ dealId, requiresNda, alreadyExpressed }: Props) {
  const [modal, setModal] = useState(false);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (alreadyExpressed || success) {
    return (
      <button disabled className="btn-primary opacity-60 cursor-default w-full">
        Intérêt déjà exprimé
      </button>
    );
  }

  function handleConfirm() {
    if (requiresNda && !ndaChecked) {
      setError("Vous devez accepter les conditions de confidentialité.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/deal-interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId,
            ndaSigned: requiresNda ? ndaChecked : false,
            message: message.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setSuccess(true);
        setModal(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <>
      <button onClick={() => { setModal(true); setError(null); }} className="btn-primary w-full">
        Exprimer mon intérêt
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isPending && setModal(false)}
        >
          <div
            className="card p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-2">Exprimer mon intérêt</h2>
            <p className="text-slate-400 text-sm mb-6">
              Votre intérêt sera transmis au porteur du projet.
            </p>

            {requiresNda && (
              <label className="flex gap-3 items-start mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ndaChecked}
                  onChange={(e) => setNdaChecked(e.target.checked)}
                  className="mt-0.5 accent-yellow-500"
                  disabled={isPending}
                />
                <span className="text-slate-300 text-sm">
                  Je m&apos;engage à respecter la confidentialité de ce dossier et à ne pas divulguer les informations partagées à des tiers.
                </span>
              </label>
            )}

            <div className="mb-4">
              <label className="label">Message (optionnel)</label>
              <textarea
                className="input w-full resize-none"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isPending}
                placeholder="Présentez brièvement votre profil ou vos questions..."
              />
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setModal(false)}
                disabled={isPending}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending || (requiresNda && !ndaChecked)}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isPending ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "InterestButton"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/investment/[id]/InterestButton.tsx
git commit -m "feat: InterestButton — NDA checkbox + interest modal"
```

---

### Task 7: /investment/[id]/page.tsx — Deal detail

**Files:**
- Create: `src/app/investment/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/investment/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import InterestButton from "./InterestButton";

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select(`
      *,
      organizations (id, name, logo_url, city, actor_type)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!deal) notFound();

  // Increment views_count (best-effort, not awaited)
  supabase
    .from("deals")
    .update({ views_count: (deal.views_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {})
    .catch(() => {});

  // Check if current user already expressed interest
  const { data: { user } } = await supabase.auth.getUser();
  let alreadyExpressed = false;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (member) {
      const { data: existing } = await supabase
        .from("deal_interests")
        .select("id")
        .eq("deal_id", id)
        .eq("investor_org_id", member.organization_id)
        .single();
      alreadyExpressed = !!existing;
    }
  }

  const org = deal.organizations as unknown as {
    name: string;
    city: string | null;
    logo_url: string | null;
    actor_type: string;
  } | null;

  function formatAmount(amount: number | null): string {
    if (!amount) return "Montant non précisé";
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
    return `${amount.toLocaleString("fr-FR")} €`;
  }

  const PROJECT_TYPE_LABELS: Record<string, string> = {
    solar: "Solaire", wind: "Éolien", storage: "Stockage",
    efficiency: "Efficacité énergétique", other: "Autre",
  };
  const FUNDING_TYPE_LABELS: Record<string, string> = {
    equity: "Equity", debt: "Dette", convertible: "Convertible", grant: "Subvention",
  };

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <Link href="/investment" className="text-slate-500 text-sm hover:text-slate-300 mb-6 inline-block">
          ← Retour aux deals
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              {deal.project_type && (
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest block mb-2">
                  {PROJECT_TYPE_LABELS[deal.project_type] || deal.project_type}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{deal.title}</h1>
            </div>
            {deal.requires_nda && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30 text-orange-400 bg-orange-500/10 whitespace-nowrap">
                NDA requis
              </span>
            )}
          </div>
          <p className="text-slate-400">
            {org?.name}
            {org?.city ? ` · ${org.city}` : ""}
            {deal.published_at ? ` · Publié le ${new Date(deal.published_at).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{deal.description}</p>
            </div>

            {/* Infos projet */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Projet</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {deal.location && (
                  <>
                    <dt className="text-slate-500">Localisation</dt>
                    <dd className="text-slate-300">{deal.location}</dd>
                  </>
                )}
                {deal.capacity_mw && (
                  <>
                    <dt className="text-slate-500">Capacité</dt>
                    <dd className="text-slate-300">{deal.capacity_mw} MW</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Financement */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Financement</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <dt className="text-slate-500">Montant recherché</dt>
                <dd className="text-green-400 font-semibold">{formatAmount(deal.funding_amount)}</dd>
                {deal.funding_type && (
                  <>
                    <dt className="text-slate-500">Type</dt>
                    <dd className="text-slate-300">{FUNDING_TYPE_LABELS[deal.funding_type] || deal.funding_type}</dd>
                  </>
                )}
                {deal.series && (
                  <>
                    <dt className="text-slate-500">Série</dt>
                    <dd className="text-slate-300">{deal.series}</dd>
                  </>
                )}
                {deal.irr_target && (
                  <>
                    <dt className="text-slate-500">IRR cible</dt>
                    <dd className="text-slate-300">{deal.irr_target}%</dd>
                  </>
                )}
                {deal.duration_years && (
                  <>
                    <dt className="text-slate-500">Durée</dt>
                    <dd className="text-slate-300">{deal.duration_years} ans</dd>
                  </>
                )}
                {deal.current_investors && (
                  <>
                    <dt className="text-slate-500">Investisseurs actuels</dt>
                    <dd className="text-slate-300">{deal.current_investors}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Section IA */}
            {deal.ai_summary && (
              <div className="card p-6 border-purple-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Analyse IA</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Résumé</p>
                    <p className="text-slate-300 text-sm">{deal.ai_summary}</p>
                  </div>
                  {deal.ai_investment_thesis && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Thèse d'investissement</p>
                      <p className="text-slate-300 text-sm">{deal.ai_investment_thesis}</p>
                    </div>
                  )}
                  {deal.ai_risk_score !== null && deal.ai_risk_score !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500">Score de risque</p>
                        <span className={`text-sm font-bold ${
                          deal.ai_risk_score <= 33 ? "text-green-400" :
                          deal.ai_risk_score <= 66 ? "text-yellow-500" : "text-red-400"
                        }`}>
                          {deal.ai_risk_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            deal.ai_risk_score <= 33 ? "bg-green-400" :
                            deal.ai_risk_score <= 66 ? "bg-yellow-500" : "bg-red-400"
                          }`}
                          style={{ width: `${deal.ai_risk_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>Faible risque</span>
                        <span>Risque élevé</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA */}
            <div className="card p-6">
              <div className="text-sm text-slate-400 mb-4">
                {deal.interests_count} investisseur{deal.interests_count !== 1 ? "s" : ""} intéressé{deal.interests_count !== 1 ? "s" : ""}
              </div>
              {user ? (
                <InterestButton
                  dealId={id}
                  requiresNda={deal.requires_nda ?? false}
                  alreadyExpressed={alreadyExpressed}
                />
              ) : (
                <Link href={`/login?redirect=/investment/${id}`} className="btn-primary block text-center">
                  Se connecter pour investir
                </Link>
              )}
              {deal.requires_nda && (
                <p className="text-xs text-slate-600 mt-3 text-center">
                  Accord de confidentialité requis
                </p>
              )}
            </div>

            {/* Documents */}
            {(deal.pitch_deck_url || deal.financial_model_url) && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Documents</h3>
                <div className="space-y-2">
                  {deal.pitch_deck_url && (
                    <a href={deal.pitch_deck_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full text-sm block text-center">
                      Pitch deck
                    </a>
                  )}
                  {deal.financial_model_url && (
                    <a href={deal.financial_model_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full text-sm block text-center">
                      Modèle financier
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "investment/\[id\]"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/investment/[id]/page.tsx
git commit -m "feat: /investment/[id] — deal detail with AI analysis + interest button"
```

---

## Chunk 4: /investment/submit + DealForm

### Task 8: DealForm.tsx — 3-step form

**Files:**
- Create: `src/app/investment/submit/DealForm.tsx`

- [ ] **Step 1: Create DealForm.tsx**

```typescript
// src/app/investment/submit/DealForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  // Step 1
  title: string;
  description: string;
  project_type: string;
  location: string;
  capacity_mw: string;
  // Step 2
  funding_amount: string;
  funding_type: string;
  series: string;
  irr_target: string;
  duration_years: string;
  current_investors: string;
  // Step 3
  pitch_deck_url: string;
  financial_model_url: string;
  requires_nda: boolean;
}

const INITIAL: FormData = {
  title: "", description: "", project_type: "", location: "", capacity_mw: "",
  funding_amount: "", funding_type: "", series: "", irr_target: "",
  duration_years: "", current_investors: "",
  pitch_deck_url: "", financial_model_url: "", requires_nda: true,
};

export default function DealForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function nextStep() {
    setError(null);
    if (step === 1) {
      if (!form.title.trim() || !form.description.trim()) {
        setError("Titre et description sont requis.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.funding_amount || Number(form.funding_amount) <= 0) {
        setError("Montant de financement requis.");
        return;
      }
      setStep(3);
    }
  }

  function prevStep() {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const body = {
          title: form.title.trim(),
          description: form.description.trim(),
          project_type: form.project_type || undefined,
          location: form.location.trim() || undefined,
          capacity_mw: form.capacity_mw ? Number(form.capacity_mw) : undefined,
          funding_amount: Number(form.funding_amount),
          funding_type: form.funding_type || undefined,
          series: form.series || undefined,
          irr_target: form.irr_target ? Number(form.irr_target) : undefined,
          duration_years: form.duration_years ? Number(form.duration_years) : undefined,
          current_investors: form.current_investors.trim() || undefined,
          pitch_deck_url: form.pitch_deck_url.trim() || undefined,
          financial_model_url: form.financial_model_url.trim() || undefined,
          requires_nda: form.requires_nda,
        };

        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de la soumission");
        router.push("/dashboard/investment?submitted=1");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const stepLabels = ["Projet", "Financement", "Publication"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${active ? "text-yellow-500" : done ? "text-green-400" : "text-slate-600"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                  active ? "border-yellow-500 bg-yellow-500/10" :
                  done ? "border-green-400 bg-green-400/10" :
                  "border-slate-700"
                }`}>
                  {done ? "✓" : n}
                </span>
                <span className="text-sm font-medium hidden sm:block">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${done ? "bg-green-400/30" : "bg-slate-800"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Projet */}
      {step === 1 && (
        <div className="card p-8 space-y-5">
          <h2 className="text-xl font-bold text-white mb-2">Le projet</h2>
          <div>
            <label className="label">Titre du projet *</label>
            <input className="input w-full" value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Parc solaire 5MW en Wallonie" />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input w-full resize-none" rows={4} value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Décrivez votre projet, son contexte, son impact et ses caractéristiques principales..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type de projet</label>
              <select className="input w-full" value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
                <option value="">Sélectionner</option>
                <option value="solar">Solaire</option>
                <option value="wind">Éolien</option>
                <option value="storage">Stockage</option>
                <option value="efficiency">Efficacité énergétique</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="label">Localisation</label>
              <input className="input w-full" value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="Ex: Namur, Belgique" />
            </div>
          </div>
          <div>
            <label className="label">Capacité (MW, optionnel)</label>
            <input type="number" className="input w-full" value={form.capacity_mw}
              onChange={(e) => set("capacity_mw", e.target.value)} placeholder="Ex: 5" min="0" step="0.1" />
          </div>
        </div>
      )}

      {/* Step 2 — Financement */}
      {step === 2 && (
        <div className="card p-8 space-y-5">
          <h2 className="text-xl font-bold text-white mb-2">Le financement</h2>
          <div>
            <label className="label">Montant recherché (€) *</label>
            <input type="number" className="input w-full" value={form.funding_amount}
              onChange={(e) => set("funding_amount", e.target.value)} placeholder="Ex: 2000000" min="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type de financement</label>
              <select className="input w-full" value={form.funding_type} onChange={(e) => set("funding_type", e.target.value)}>
                <option value="">Sélectionner</option>
                <option value="equity">Equity</option>
                <option value="debt">Dette</option>
                <option value="convertible">Convertible</option>
                <option value="grant">Subvention</option>
              </select>
            </div>
            <div>
              <label className="label">Série</label>
              <select className="input w-full" value={form.series} onChange={(e) => set("series", e.target.value)}>
                <option value="">Sélectionner</option>
                <option value="pre-seed">Pre-seed</option>
                <option value="seed">Seed</option>
                <option value="series-a">Series A</option>
                <option value="series-b">Series B</option>
                <option value="growth">Growth</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">IRR cible (%)</label>
              <input type="number" className="input w-full" value={form.irr_target}
                onChange={(e) => set("irr_target", e.target.value)} placeholder="Ex: 12" min="0" max="100" step="0.1" />
            </div>
            <div>
              <label className="label">Durée (années)</label>
              <input type="number" className="input w-full" value={form.duration_years}
                onChange={(e) => set("duration_years", e.target.value)} placeholder="Ex: 10" min="1" />
            </div>
          </div>
          <div>
            <label className="label">Investisseurs actuels (optionnel)</label>
            <textarea className="input w-full resize-none" rows={2} value={form.current_investors}
              onChange={(e) => set("current_investors", e.target.value)}
              placeholder="Ex: BNP Paribas Fortis, Belfius..." />
          </div>
        </div>
      )}

      {/* Step 3 — Documents & Publication */}
      {step === 3 && (
        <div className="card p-8 space-y-5">
          <h2 className="text-xl font-bold text-white mb-2">Documents & publication</h2>
          <div>
            <label className="label">URL Pitch Deck (optionnel)</label>
            <input type="url" className="input w-full" value={form.pitch_deck_url}
              onChange={(e) => set("pitch_deck_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="label">URL Modèle financier (optionnel)</label>
            <input type="url" className="input w-full" value={form.financial_model_url}
              onChange={(e) => set("financial_model_url", e.target.value)} placeholder="https://..." />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set("requires_nda", !form.requires_nda)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                form.requires_nda ? "bg-yellow-500" : "bg-slate-700"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                form.requires_nda ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </div>
            <span className="text-slate-300 text-sm">Accord de confidentialité (NDA) requis pour voir les documents</span>
          </label>

          {/* Preview */}
          <div className="border border-slate-800 rounded-lg p-4 mt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Récapitulatif</p>
            <dl className="text-sm space-y-1">
              <div className="flex gap-2"><dt className="text-slate-500 w-28 shrink-0">Titre</dt><dd className="text-slate-300">{form.title || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-28 shrink-0">Type</dt><dd className="text-slate-300">{form.project_type || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-28 shrink-0">Montant</dt><dd className="text-slate-300">{form.funding_amount ? `${Number(form.funding_amount).toLocaleString("fr-FR")} €` : "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-28 shrink-0">Financement</dt><dd className="text-slate-300">{form.funding_type || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-28 shrink-0">NDA</dt><dd className="text-slate-300">{form.requires_nda ? "Oui" : "Non"}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 ? (
          <button onClick={prevStep} disabled={isPending} className="btn-secondary">
            ← Retour
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button onClick={nextStep} className="btn-primary">
            Suivant →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending} className="btn-primary disabled:opacity-50">
            {isPending ? "Analyse IA en cours (~5s)..." : "Soumettre le deal"}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "submit/DealForm"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/investment/submit/DealForm.tsx
git commit -m "feat: DealForm — 3-step deal submission form"
```

---

### Task 9: /investment/submit/page.tsx

**Files:**
- Create: `src/app/investment/submit/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/investment/submit/page.tsx
import DealForm from "./DealForm";

export const metadata = {
  title: "Soumettre un deal — EnergyHub",
};

export default function SubmitDealPage() {
  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-3">
            Investissement
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Soumettre un deal</h1>
          <p className="text-slate-400">
            Présentez votre projet aux investisseurs de la marketplace EnergyHub.
            Une analyse IA sera générée automatiquement après soumission.
          </p>
        </div>
        <DealForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "submit/page"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/investment/submit/page.tsx
git commit -m "feat: /investment/submit — deal submission page wrapper"
```

---

## Chunk 5: /dashboard/investment

### Task 10: /dashboard/investment/page.tsx

**Files:**
- Create: `src/app/dashboard/investment/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/dashboard/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Investissement — Dashboard EnergyHub",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "text-slate-400 border-slate-700 bg-slate-800/50" },
  published: { label: "Publié", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  under_review: { label: "En revue", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  closed: { label: "Clôturé", color: "text-slate-500 border-slate-700 bg-slate-800/50" },
};

const INTEREST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  interested: { label: "Intéressé", color: "text-blue-400" },
  in_discussion: { label: "En discussion", color: "text-yellow-500" },
  passed: { label: "Passé", color: "text-slate-500" },
};

export default async function DashboardInvestmentPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/dashboard");
  const orgId = member.organization_id as string;

  // Fetch my deals
  const { data: myDeals } = await supabase
    .from("deals")
    .select("id, title, status, views_count, interests_count, published_at, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // Fetch interests received on my deals (join through deal_id)
  const myDealIds = (myDeals ?? []).map((d) => d.id);
  const { data: interestsReceived } = myDealIds.length > 0
    ? await supabase
        .from("deal_interests")
        .select(`
          id, message, nda_signed, status, created_at,
          deals (id, title),
          organizations!investor_org_id (id, name, city, actor_type)
        `)
        .in("deal_id", myDealIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Dashboard</div>
          <h1 className="text-2xl font-bold text-white">Module Investissement</h1>
        </div>
        <Link href="/investment/submit" className="btn-primary">
          Nouveau deal +
        </Link>
      </div>

      {/* Success banner */}
      {submitted === "1" && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Deal soumis avec succès ! L&apos;analyse IA a été générée automatiquement.
        </div>
      )}

      {/* Mes deals */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Mes deals</h2>
        {!myDeals || myDeals.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <p className="mb-4">Vous n&apos;avez pas encore soumis de deal.</p>
            <Link href="/investment/submit" className="btn-primary inline-block">
              Soumettre un premier deal →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myDeals.map((deal) => {
              const cfg = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
              return (
                <div key={deal.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link href={`/investment/${deal.id}`} className="text-white font-medium hover:text-yellow-500 transition-colors">
                      {deal.title}
                    </Link>
                    <p className="text-slate-500 text-xs mt-1">
                      {deal.views_count ?? 0} vue{(deal.views_count ?? 0) !== 1 ? "s" : ""} ·{" "}
                      {deal.interests_count ?? 0} intérêt{(deal.interests_count ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Intérêts reçus */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Intérêts reçus</h2>
        {!interestsReceived || interestsReceived.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            Aucun investisseur n&apos;a encore exprimé son intérêt pour vos deals.
          </div>
        ) : (
          <div className="space-y-3">
            {interestsReceived.map((interest) => {
              const deal = interest.deals as unknown as { id: string; title: string } | null;
              const investorOrg = interest.organizations as unknown as { name: string; city: string | null; actor_type: string } | null;
              const statusCfg = INTEREST_STATUS_CONFIG[interest.status] || INTEREST_STATUS_CONFIG.interested;
              return (
                <div key={interest.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div>
                      <p className="text-white font-medium">{investorOrg?.name ?? "Organisation inconnue"}</p>
                      {investorOrg?.city && (
                        <p className="text-slate-500 text-xs">{investorOrg.city} · {investorOrg.actor_type}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                      <p className="text-slate-600 text-xs mt-1">
                        {new Date(interest.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {deal && (
                    <p className="text-slate-500 text-xs mb-2">
                      Deal : <Link href={`/investment/${deal.id}`} className="text-slate-400 hover:text-white">{deal.title}</Link>
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={interest.nda_signed ? "text-green-400" : "text-slate-600"}>
                      NDA {interest.nda_signed ? "signé" : "non signé"}
                    </span>
                    {interest.message && (
                      <span className="text-slate-400 italic">&ldquo;{interest.message}&rdquo;</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "dashboard/investment"
```

Expected: no output

- [ ] **Step 3: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no output (zero errors across the whole project)

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/investment/page.tsx
git commit -m "feat: /dashboard/investment — my deals + interests received"
```

- [ ] **Step 5: Push**

```bash
git push
```
