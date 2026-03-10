# RFQ Detail + Response Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer `/rfq/[id]` — page publique de détail d'un RFQ avec formulaire de réponse (limite 1/mois Free, confirmation inline).

**Architecture:** Server Component pour fetch RFQ + réponse existante. Server Action `submitResponse` pour la soumission. Client Component `ResponseForm` pour l'interactivité du formulaire (état success, validation).

**Tech Stack:** Next.js 15 App Router, Supabase server client, Server Actions, Tailwind CSS, classes custom `.card` `.btn-primary` `.btn-secondary` `.input` `.label`

---

## Contexte important

- **Couleurs Tailwind** : `bg-slate-900`, `border-slate-800`, `text-yellow-500`, `text-green-400`, `text-red-400` — PAS de `bg-surface-*`
- **Classes custom** : `.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`
- **rfq_status enum** : `'draft' | 'published' | 'responses_open' | 'under_review' | 'closed' | 'cancelled'`
- **response_status enum** : `'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'selected'`
- **Limite Free** : 1 réponse/mois (compté sur `rfq_responses.submitted_at` >= début du mois)
- **Pattern Server Action** : voir `src/app/dashboard/rfq/actions.ts`
- **ACTOR_LABELS** : même map que dans `src/app/rfq/RFQClient.tsx`
- **rfq_type enum** : `'rfi' | 'rfq' | 'rfp'`

---

### Task 1: Server Action submitResponse

**Files:**
- Create: `src/app/rfq/[id]/actions.ts`

**Step 1: Créer le fichier**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitResponse(rfqId: string, formData: {
  message: string;
  price_range?: string;
  delivery_timeline?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connectez-vous pour répondre à ce RFQ");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(subscription_plan)")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Membre introuvable");

  const org = member.organizations as unknown as { subscription_plan: string };
  const orgId = member.organization_id as string;

  // Vérifier doublon
  const { count: existingCount } = await supabase
    .from("rfq_responses")
    .select("*", { count: "exact", head: true })
    .eq("rfq_id", rfqId)
    .eq("organization_id", orgId);

  if ((existingCount || 0) > 0) {
    throw new Error("Votre organisation a déjà répondu à cet appel d'offres");
  }

  // Vérifier limite Free (1 réponse/mois)
  if (org?.subscription_plan === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("rfq_responses")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("submitted_at", startOfMonth.toISOString());

    if ((count || 0) >= 1) {
      throw new Error("LIMIT_REACHED");
    }
  }

  // Valider message
  if (!formData.message || formData.message.trim().length < 50) {
    throw new Error("Le message doit contenir au moins 50 caractères");
  }

  const { error } = await supabase
    .from("rfq_responses")
    .insert({
      rfq_id: rfqId,
      organization_id: orgId,
      submitted_by: user.id,
      message: formData.message.trim(),
      price_range: formData.price_range?.trim() || null,
      delivery_timeline: formData.delivery_timeline?.trim() || null,
      status: "submitted",
    });

  if (error) throw new Error(error.message);
  revalidatePath(`/rfq/${rfqId}`);
}
```

**Step 2: Commit**

```bash
git add src/app/rfq/[id]/actions.ts
git commit -m "feat: submitResponse server action with free limit check"
```

---

### Task 2: ResponseForm Client Component

**Files:**
- Create: `src/app/rfq/[id]/ResponseForm.tsx`

**Step 1: Créer le composant**

```typescript
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitResponse } from "./actions";

interface ExistingResponse {
  message: string;
  price_range: string | null;
  delivery_timeline: string | null;
  submitted_at: string;
}

interface Props {
  rfqId: string;
  isLoggedIn: boolean;
  isOpen: boolean; // RFQ accepte les réponses
  isLimitReached: boolean; // Free limit atteinte
  existingResponse: ExistingResponse | null;
}

export default function ResponseForm({ rfqId, isLoggedIn, isOpen, isLimitReached, existingResponse }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");

  // Non connecté
  if (!isLoggedIn) {
    return (
      <div className="card p-6 text-center">
        <p className="text-slate-400 mb-4">Connectez-vous pour répondre à cet appel d'offres</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-primary">Se connecter</Link>
          <Link href="/register" className="btn-secondary">S'inscrire</Link>
        </div>
      </div>
    );
  }

  // RFQ fermé
  if (!isOpen) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <p>Cet appel d'offres n'accepte plus de réponses.</p>
      </div>
    );
  }

  // Réponse existante
  if (existingResponse || success) {
    const resp = existingResponse;
    return (
      <div className="card p-6 border-green-400/20">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-400 text-lg">✓</span>
          <span className="font-semibold text-white text-sm">
            {success ? "Réponse soumise avec succès !" : "Vous avez déjà répondu"}
          </span>
        </div>
        {resp && (
          <div className="space-y-3 text-sm text-slate-400">
            <p className="leading-relaxed">{resp.message}</p>
            {resp.price_range && <p>💰 {resp.price_range}</p>}
            {resp.delivery_timeline && <p>🗓 {resp.delivery_timeline}</p>}
            <p className="text-[10px] text-slate-600">
              Soumis le {new Date(resp.submitted_at).toLocaleDateString("fr-BE")}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Limite Free atteinte
  if (isLimitReached) {
    return (
      <div className="card p-6 border-yellow-500/20">
        <p className="text-yellow-500 font-semibold text-sm mb-2">Limite mensuelle atteinte</p>
        <p className="text-slate-500 text-sm mb-4">
          Le plan Starter permet 1 réponse par mois. Passez au Pro pour répondre sans limite.
        </p>
        <Link href="/pricing" className="btn-primary text-sm">Voir les offres Pro →</Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitResponse(rfqId, {
          message,
          price_range: priceRange || undefined,
          delivery_timeline: deliveryTimeline || undefined,
        });
        setSuccess(true);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "LIMIT_REACHED") {
          setError("Limite mensuelle atteinte. Passez au Pro pour répondre sans limite.");
        } else {
          setError(msg);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h3 className="font-semibold text-white">Soumettre une réponse</h3>

      <div>
        <label className="label">Message <span className="text-red-400">*</span></label>
        <textarea
          className="input min-h-[120px] resize-y"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Décrivez votre approche, vos références, pourquoi vous êtes le bon prestataire... (min 50 caractères)"
          required
          minLength={50}
        />
        <p className="text-[10px] text-slate-600 mt-1">{message.length} / 50 min</p>
      </div>

      <div>
        <label className="label">Fourchette de prix</label>
        <input
          className="input"
          value={priceRange}
          onChange={e => setPriceRange(e.target.value)}
          placeholder="ex: 50 000€ - 80 000€"
        />
      </div>

      <div>
        <label className="label">Délai de réalisation</label>
        <input
          className="input"
          value={deliveryTimeline}
          onChange={e => setDeliveryTimeline(e.target.value)}
          placeholder="ex: 3 mois"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || message.trim().length < 50}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isPending ? "Envoi en cours..." : "Soumettre ma réponse →"}
      </button>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/rfq/[id]/ResponseForm.tsx
git commit -m "feat: ResponseForm client component"
```

---

### Task 3: Page Server Component

**Files:**
- Create: `src/app/rfq/[id]/page.tsx`

**Step 1: Créer la page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResponseForm from "./ResponseForm";

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  rfq: { label: "RFQ", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  rfi: { label: "RFI", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  rfp: { label: "RFP", color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
};

const OPEN_STATUSES = ["published", "responses_open", "under_review"];

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch RFQ
  const { data: rfq } = await supabase
    .from("rfqs")
    .select(`
      *,
      organizations (id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("id", id)
    .neq("status", "draft")
    .single();

  if (!rfq) notFound();

  const typeCfg = TYPE_CONFIG[rfq.type] || TYPE_CONFIG.rfq;
  const org = rfq.organizations as {
    id: string; name: string; slug: string; actor_type: string;
    logo_url: string | null; city: string | null; is_verified: boolean;
  } | null;
  const orgType = org ? (ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" }) : null;

  const deadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const isOpen = OPEN_STATUSES.includes(rfq.status);

  // Données user si connecté
  let memberOrgId: string | null = null;
  let existingResponse = null;
  let isLimitReached = false;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(subscription_plan)")
      .eq("id", user.id)
      .single();

    if (member) {
      memberOrgId = member.organization_id as string;
      const memberOrg = member.organizations as unknown as { subscription_plan: string } | null;

      // Réponse existante
      const { data: resp } = await supabase
        .from("rfq_responses")
        .select("message, price_range, delivery_timeline, submitted_at")
        .eq("rfq_id", id)
        .eq("organization_id", memberOrgId)
        .maybeSingle();
      existingResponse = resp;

      // Limite Free
      if (memberOrg?.subscription_plan === "free" && !resp) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("rfq_responses")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", memberOrgId)
          .gte("submitted_at", startOfMonth.toISOString());
        isLimitReached = (count || 0) >= 1;
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/rfq" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Retour aux appels d'offres
          </Link>
        </div>

        <div className="flex gap-8 items-start">

          {/* ── Contenu principal ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Header */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeCfg.color}`}>
                  {typeCfg.label}
                </span>
                <span className="text-xs text-slate-500">
                  Publié le {rfq.published_at
                    ? new Date(rfq.published_at).toLocaleDateString("fr-BE")
                    : "—"}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mb-4 leading-snug">{rfq.title}</h1>

              {/* Org émettrice */}
              {org && (
                <Link href={`/directory/${org.slug}`} className="flex items-center gap-3 group w-fit">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {org.logo_url
                      ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
                      : orgType?.icon || "🏢"}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors">
                      {org.name}
                      {org.is_verified && <span className="text-green-400 ml-1 text-xs">✓</span>}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {orgType?.icon} {orgType?.label}
                      {org.city && ` · ${org.city}`}
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.description}</p>
            </div>

            {/* Requirements */}
            {rfq.requirements && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Cahier des charges</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.requirements}</p>
              </div>
            )}

            {/* Acteurs ciblés + tags */}
            {(rfq.target_actor_types?.length > 0 || rfq.tags?.length > 0) && (
              <div className="card p-6 space-y-4">
                {rfq.target_actor_types?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Acteurs recherchés</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.target_actor_types.map((type: string) => {
                        const info = ACTOR_LABELS[type] || { label: type, icon: "🏢" };
                        return (
                          <span key={type} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {info.icon} {info.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {rfq.tags?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire de réponse */}
            <div id="respond">
              <h2 className="text-lg font-semibold text-white mb-4">Répondre à cet appel d'offres</h2>
              <ResponseForm
                rfqId={id}
                isLoggedIn={!!user}
                isOpen={isOpen}
                isLimitReached={isLimitReached}
                existingResponse={existingResponse}
              />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-72 shrink-0 sticky top-8 space-y-4">

            {/* Infos clés */}
            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Détails</h3>
              {rfq.budget_range && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">💰</span>
                  <span className="text-slate-300">{rfq.budget_range}</span>
                </div>
              )}
              {deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📅</span>
                  <span className="text-slate-300">{deadline}</span>
                </div>
              )}
              {rfq.location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📍</span>
                  <span className="text-slate-300">{rfq.location}</span>
                </div>
              )}
              {rfq.responses_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📬</span>
                  <span className="text-slate-300">{rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            {/* Résumé IA */}
            {rfq.ai_summary && (
              <div className="card p-5 border-green-400/10">
                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">🤖 Analyse IA</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rfq.ai_summary}</p>
              </div>
            )}

            {/* CTA répondre */}
            {isOpen && user && !existingResponse && !isLimitReached && (
              <a href="#respond" className="btn-primary w-full block text-center">
                Répondre à ce RFQ →
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/rfq/[id]/page.tsx
git commit -m "feat: rfq/[id] detail page with response form"
```

---

### Task 4: Vérification TypeScript

**Step 1:**
```bash
npx tsc --noEmit 2>&1 | grep "rfq/\[id\]"
```
Expected: aucune sortie

**Step 2: Commit si corrections nécessaires**
```bash
git add src/app/rfq/[id]/
git commit -m "fix: TypeScript corrections rfq/[id]"
```

---

### Task 5: Vérification manuelle

**Step 1:** `npm run dev`

**Checklist:**
- [ ] `/rfq` → cliquer "Voir le détail" sur une card → `/rfq/[id]` s'affiche
- [ ] Header : badge type, titre, org émettrice cliquable
- [ ] Description, requirements (si présent), acteurs ciblés, tags affichés
- [ ] Sidebar : budget, deadline, location, count réponses, résumé IA si disponible
- [ ] Non connecté : formulaire remplacé par CTA login/register
- [ ] Connecté Free sans réponse : formulaire affiché avec les 3 champs
- [ ] Message < 50 chars : bouton "Soumettre" désactivé
- [ ] Soumission réussie : message de confirmation inline
- [ ] Deuxième tentative sur même RFQ : message "déjà répondu"

**Step 2:**
```bash
git commit -m "feat: F8 /rfq/[id] complete" --allow-empty
```
