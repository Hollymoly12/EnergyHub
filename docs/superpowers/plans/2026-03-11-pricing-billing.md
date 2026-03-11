# Pricing + Billing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/pricing` page with 3 plan cards + upgrade modal → Stripe Checkout, and a `/dashboard/billing` page that redirects to Stripe Portal.

**Architecture:** `pricing/page.tsx` is a public Server Component that detects the current user's plan and passes it to `PricingClient.tsx` for modal interactions. Two new API routes handle Stripe Checkout and Portal sessions. `/dashboard/billing` is a minimal Server Component that fetches plan info and provides a portal redirect button.

**Tech Stack:** Next.js 15 App Router, Supabase (server client), Stripe SDK (`@/lib/stripe`), Resend (email), Tailwind CSS + custom classes (`.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`)

---

## Chunk 1: API Routes (checkout, portal, contact)

### Task 1: POST /api/stripe/checkout

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create the file with auth + member fetch**

```typescript
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, createCheckoutSession, PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(name, stripe_customer_id, subscription_plan)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const org = member.organizations as unknown as {
      name: string;
      stripe_customer_id: string | null;
      subscription_plan: string;
    };
    const orgId = member.organization_id as string;

    if (org.subscription_plan !== "free") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const body = await req.json();
    const { plan } = body;
    if (plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = PLANS.pro.priceId;
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    const customerId = await getOrCreateStripeCustomer({
      organizationId: orgId,
      orgName: org.name,
      email: user.email!,
      existingCustomerId: org.stripe_customer_id || undefined,
    });

    if (!org.stripe_customer_id) {
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const url = await createCheckoutSession({
      customerId,
      priceId,
      organizationId: orgId,
      successUrl: `${appUrl}/dashboard/billing?success=1`,
      cancelUrl: `${appUrl}/pricing`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "stripe/checkout"
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/checkout/route.ts
git commit -m "feat: POST /api/stripe/checkout — create Stripe Checkout session"
```

---

### Task 2: POST /api/stripe/portal

**Files:**
- Create: `src/app/api/stripe/portal/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(stripe_customer_id)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const org = member.organizations as unknown as { stripe_customer_id: string | null };
    if (!org.stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const url = await createBillingPortalSession(
      org.stripe_customer_id,
      `${appUrl}/dashboard/billing`
    );

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "stripe/portal"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/portal/route.ts
git commit -m "feat: POST /api/stripe/portal — redirect to Stripe Billing Portal"
```

---

### Task 3: POST /api/contact (Enterprise)

**Files:**
- Create: `src/app/api/contact/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: process.env.EMAIL_FROM!,
      subject: `Demande Enterprise — EnergyHub`,
      text: `Nom: ${name}\nEmail: ${email}\n\n${message || "(aucun message)"}`,
      html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message || "(aucun message)"}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "api/contact"
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/app/api/contact/route.ts
git commit -m "feat: POST /api/contact — Enterprise contact form via Resend"
```

---

## Chunk 2: PricingClient + /pricing page

### Task 4: PricingClient.tsx

**Files:**
- Create: `src/app/pricing/PricingClient.tsx`

- [ ] **Step 1: Create the client component**

`PricingClient` renders all 3 plan cards (with CTA buttons) and the Pro/Enterprise modals. It receives `currentPlan` and `isLoggedIn` from the Server Component parent.

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  currentPlan: string | null;
  isLoggedIn: boolean;
}

export default function PricingClient({ currentPlan, isLoggedIn }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<"pro" | "enterprise" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entName, setEntName] = useState("");
  const [entEmail, setEntEmail] = useState("");
  const [entMessage, setEntMessage] = useState("");
  const [entSuccess, setEntSuccess] = useState(false);
  const [entPending, startEntTransition] = useTransition();

  function openPro() {
    if (!isLoggedIn) { router.push("/login?redirect=/pricing"); return; }
    setModal("pro");
    setError(null);
  }

  function openEnterprise() {
    setModal("enterprise");
    setEntSuccess(false);
    setError(null);
    setEntName(""); setEntEmail(""); setEntMessage("");
  }

  function confirmPro() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "pro" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        router.push(data.url);
      } catch (e) { setError((e as Error).message); }
    });
  }

  function sendEnterprise(e: React.FormEvent) {
    e.preventDefault();
    startEntTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: entName, email: entEmail, message: entMessage }),
        });
        if (!res.ok) throw new Error("Erreur lors de l'envoi");
        setEntSuccess(true);
      } catch (e) { setError((e as Error).message); }
    });
  }

  const isCurrentPro = currentPlan === "pro" || currentPlan === "enterprise";

  return (
    <>
      {/* ── 3 plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

        {/* Starter */}
        <div className="card p-8 flex flex-col">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Starter</div>
          <div className="text-4xl font-bold text-white mb-1">€0</div>
          <p className="text-slate-500 text-sm mb-6">Pour découvrir EnergyHub</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> 1 RFQ par mois</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Accès annuaire</li>
            <li className="flex gap-2"><span className="text-slate-600">✗</span> Réponses aux RFQ</li>
            <li className="flex gap-2"><span className="text-slate-600">✗</span> Matching IA</li>
          </ul>
          {!isLoggedIn ? (
            <a href="/register" className="btn-secondary text-center block">Commencer gratuitement</a>
          ) : (
            <button disabled className="btn-secondary opacity-50 cursor-default">
              {currentPlan === "free" ? "Plan actuel" : "Plan de base"}
            </button>
          )}
        </div>

        {/* Pro */}
        <div className="card p-8 flex flex-col border-yellow-500/50 relative" style={{ transform: "scale(1.03)" }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-yellow-500 text-black">POPULAIRE</span>
          </div>
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-4">Pro</div>
          <div className="text-4xl font-bold text-white mb-1">€149<span className="text-base font-normal text-slate-400">/mois</span></div>
          <p className="text-slate-500 text-sm mb-6">Pour les acteurs actifs</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> RFQ illimités</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Réponses aux RFQ</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Matching IA (score 0-100)</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Analytics</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Module investissement</li>
          </ul>
          {isCurrentPro ? (
            <button disabled className="btn-primary opacity-50 cursor-default">Plan actuel</button>
          ) : (
            <button onClick={openPro} className="btn-primary">
              {isLoggedIn ? "Passer au Pro" : "Commencer avec Pro"}
            </button>
          )}
        </div>

        {/* Enterprise */}
        <div className="card p-8 flex flex-col border-purple-500/20">
          <div className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-4">Enterprise</div>
          <div className="text-4xl font-bold text-white mb-1">Sur devis</div>
          <p className="text-slate-500 text-sm mb-6">Pour les grandes organisations</p>
          <ul className="space-y-3 text-sm text-slate-400 mb-8 flex-1">
            <li className="flex gap-2"><span className="text-green-400">✓</span> Tout le plan Pro</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Multi-sièges</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Accès API</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Support dédié</li>
          </ul>
          <button onClick={openEnterprise} className="btn-secondary">Nous contacter</button>
        </div>
      </div>

      {/* ── Modal Pro ── */}
      {modal === "pro" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isPending && setModal(null)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Passer au plan Pro</h2>
            <p className="text-slate-400 text-sm mb-4">Accédez à tous les outils de la marketplace.</p>
            <ul className="text-sm text-slate-300 space-y-2 mb-6">
              <li>✓ RFQ illimités</li>
              <li>✓ Matching IA</li>
              <li>✓ Analytics</li>
              <li>✓ Module investissement</li>
            </ul>
            <div className="text-2xl font-bold text-white mb-1">
              €149<span className="text-sm font-normal text-slate-400">/mois</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">Résiliable à tout moment — sans engagement</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={isPending} className="btn-secondary flex-1">Annuler</button>
              <button onClick={confirmPro} disabled={isPending} className="btn-primary flex-1 disabled:opacity-50">
                {isPending ? "Redirection..." : "Confirmer et payer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Enterprise ── */}
      {modal === "enterprise" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !entPending && setModal(null)}>
          <div className="card p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Demande Enterprise</h2>
            <p className="text-slate-400 text-sm mb-6">Notre équipe vous contacte sous 24h.</p>
            {entSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <p className="text-green-400 font-medium">Message envoyé !</p>
                <p className="text-slate-500 text-sm mt-1">Nous vous recontactons rapidement.</p>
                <button onClick={() => setModal(null)} className="btn-secondary mt-6">Fermer</button>
              </div>
            ) : (
              <form onSubmit={sendEnterprise} className="space-y-4">
                <div>
                  <label className="label">Nom *</label>
                  <input className="input w-full" value={entName} onChange={e => setEntName(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input w-full" value={entEmail} onChange={e => setEntEmail(e.target.value)} required disabled={entPending} />
                </div>
                <div>
                  <label className="label">Message (optionnel)</label>
                  <textarea className="input w-full resize-none" rows={3} value={entMessage} onChange={e => setEntMessage(e.target.value)} disabled={entPending} placeholder="Décrivez votre besoin..." />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(null)} disabled={entPending} className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" disabled={entPending || !entName.trim() || !entEmail.trim()} className="btn-primary flex-1 disabled:opacity-50">
                    {entPending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "pricing/PricingClient"
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/PricingClient.tsx
git commit -m "feat: PricingClient — 3 plan cards + Pro/Enterprise modals"
```

---

### Task 5: /pricing/page.tsx (Server Component)

**Files:**
- Create: `src/app/pricing/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/pricing/page.tsx
import { createClient } from "@/lib/supabase/server";
import PricingClient from "./PricingClient";

export const metadata = {
  title: "Tarifs — EnergyHub",
  description: "Choisissez le plan adapté à votre organisation sur EnergyHub.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentPlan: string | null = null;
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organizations(subscription_plan)")
      .eq("id", user.id)
      .single();
    const org = member?.organizations as unknown as { subscription_plan: string } | null;
    currentPlan = org?.subscription_plan || "free";
  }

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-3">Tarifs</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Accédez aux outils de la marketplace B2B de la transition énergétique belge.
            Sans engagement, résiliable à tout moment.
          </p>
        </div>

        {/* Plan cards rendered by Client Component */}
        <PricingClient currentPlan={currentPlan} isLoggedIn={!!user} />

        {/* Trust signals */}
        <div className="mt-16 text-center text-slate-600 text-sm space-x-6">
          <span>🔒 Paiement sécurisé Stripe</span>
          <span>📄 Facturation mensuelle</span>
          <span>❌ Sans engagement</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "pricing/page"
```

Expected: no output

- [ ] **Step 3: Test locally — open http://localhost:3000/pricing**

Expected:
- Page visible sans connexion
- 3 cartes affichées, Pro légèrement agrandi avec badge "POPULAIRE"
- Clic "Commencer gratuitement" sur Starter → /register
- Clic "Nous contacter" sur Enterprise → modal s'ouvre

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat: /pricing page — public pricing with 3 plan cards"
```

---

## Chunk 3: /dashboard/billing page

### Task 6: BillingPortalButton + /dashboard/billing/page.tsx

**Files:**
- Create: `src/app/dashboard/billing/BillingPortalButton.tsx`
- Create: `src/app/dashboard/billing/page.tsx`

- [ ] **Step 1: Fix portal route to return JSON (not redirect)**

Task 2 committed the portal route with `NextResponse.redirect(url)`. `BillingPortalButton` needs to read `data.url` from JSON, so update the route:

In `src/app/api/stripe/portal/route.ts`, replace:
```typescript
    return NextResponse.redirect(url);
```
with:
```typescript
    return NextResponse.json({ url });
```

Then commit:
```bash
git add src/app/api/stripe/portal/route.ts
git commit -m "fix: portal route returns JSON url instead of redirect"
```

- [ ] **Step 2: Create BillingPortalButton client component**

The `/api/stripe/portal` route now returns JSON `{ url }`. A small Client Component fetches it and redirects the browser.

```typescript
// src/app/dashboard/billing/BillingPortalButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function BillingPortalButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary disabled:opacity-50"
    >
      {isPending ? "Redirection..." : "Gérer l'abonnement →"}
    </button>
  );
}
```


- [ ] **Step 3: Create the billing page**

```typescript
// src/app/dashboard/billing/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BillingPortalButton from "./BillingPortalButton";

const PLAN_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  free: {
    label: "Starter",
    color: "text-slate-400 border-slate-700 bg-slate-800/50",
    description: "Plan gratuit — 1 RFQ par mois, accès annuaire",
  },
  pro: {
    label: "Pro",
    color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
    description: "RFQ illimités, matching IA, analytics, module investissement",
  },
  enterprise: {
    label: "Enterprise",
    color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    description: "Tout le plan Pro + multi-sièges, API, support dédié",
  },
};

export const metadata = {
  title: "Abonnement — EnergyHub",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organizations(subscription_plan, stripe_customer_id, name)")
    .eq("id", user.id)
    .single();

  if (!member) redirect("/dashboard");

  const org = member.organizations as unknown as {
    subscription_plan: string;
    stripe_customer_id: string | null;
    name: string;
  } | null;

  const plan = org?.subscription_plan || "free";
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const hasStripe = !!org?.stripe_customer_id;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Abonnement</div>
        <h1 className="text-2xl font-bold text-white">Gérer mon abonnement</h1>
      </div>

      {/* Success banner */}
      {success === "1" && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Abonnement activé avec succès ! Bienvenue sur le plan Pro.
        </div>
      )}

      {/* Plan actuel */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Plan actuel</h2>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${planCfg.color}`}>
            {planCfg.label}
          </span>
          <p className="text-slate-400 text-sm">{planCfg.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Actions</h2>

        {plan === "free" ? (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">
              Passez au plan Pro pour accéder à toutes les fonctionnalités d'EnergyHub.
            </p>
            <Link href="/pricing" className="btn-primary inline-block">
              Voir les tarifs →
            </Link>
          </div>
        ) : hasStripe ? (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">
              Gérez votre abonnement, vos factures et vos informations de paiement via le portail Stripe.
            </p>
            <BillingPortalButton />
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Aucun abonnement Stripe actif trouvé. Contactez le support si vous pensez qu'il s'agit d'une erreur.
          </p>
        )}
      </div>
    </div>
  );
}
```


- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "dashboard/billing"
```

Expected: no output

- [ ] **Step 5: Test locally**

Navigate to http://localhost:3000/dashboard/billing (must be logged in).

Expected:
- Plan badge shown correctly
- Free plan → "Voir les tarifs" link to /pricing
- Pro plan with stripe_customer_id → "Gérer l'abonnement" button, click redirects to Stripe Portal

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/billing/BillingPortalButton.tsx src/app/dashboard/billing/page.tsx
git commit -m "feat: /dashboard/billing — plan overview + Stripe Portal redirect"
```

---

### Task 7: Final TypeScript check + push

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no output (zero errors)

- [ ] **Step 2: Test the full Pro upgrade flow locally**

1. Log in as a Free user
2. Go to /pricing
3. Click "Passer au Pro"
4. Modal appears → click "Confirmer et payer"
5. Should redirect to Stripe Checkout (mode test, use card 4242 4242 4242 4242)
6. After payment → redirected to /dashboard/billing?success=1
7. Banner "Abonnement activé" visible

> In local dev, Stripe Checkout requires `NEXT_PUBLIC_APP_URL` to be set correctly. If Stripe rejects the redirect URL, check the env variable.

- [ ] **Step 3: Push**

```bash
git push
```
