# F5 — RFQ Create Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer la page `/rfq/create` avec un wizard 3 étapes pour publier ou sauvegarder en draft un appel d'offres.

**Architecture:** Middleware existant protège déjà `/rfq/create` (auth). On ajoute `/rfq/create` aux PRO_ROUTES pour rediriger les plans Free vers `/pricing`. Server Component `page.tsx` minimal, Client Component `RFQCreateForm.tsx` contient tout le wizard.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS vanilla, classes custom `.card`, `.input`, `.label`, `.btn-primary`, `.btn-secondary`. POST vers `/api/rfq`. Après succès → redirect `/rfq/[id]`.

---

### Task 1 : Middleware — ajouter /rfq/create aux PRO_ROUTES

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Ajouter `/rfq/create` dans PRO_ROUTES**

Dans `src/middleware.ts`, trouver :
```ts
const PRO_ROUTES = ["/rfq/respond", "/investment", "/analytics"];
```

Remplacer par :
```ts
const PRO_ROUTES = ["/rfq/create", "/rfq/respond", "/investment", "/analytics"];
```

**Step 2: Vérifier TypeScript**
```bash
cd /Users/tomlibion/Downloads/EnergyHub-main && npx tsc --noEmit 2>&1 | head -10
```
Attendu : aucune erreur.

**Step 3: Commit**
```bash
git add src/middleware.ts
git commit -m "feat: F5 add rfq/create to pro routes middleware"
```

---

### Task 2 : Server Component `page.tsx`

**Files:**
- Create: `src/app/rfq/create/page.tsx`

**Step 1: Créer le fichier**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RFQCreateForm from "./RFQCreateForm";

export const metadata = {
  title: "Publier un RFQ — EnergyHub",
};

export default async function RFQCreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/rfq/create");

  const { data: member } = await supabase
    .from("members")
    .select("organizations(subscription_plan)")
    .eq("id", user.id)
    .single();

  const org = member?.organizations as unknown as { subscription_plan: string } | null;
  if (!org || org.subscription_plan === "free") {
    redirect("/pricing?reason=pro_required");
  }

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">
            Appels d'offres
          </div>
          <h1 className="text-3xl font-bold text-white">Publier un appel d'offres</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Rédigez votre RFQ et recevez des propositions qualifiées grâce au matching IA.
          </p>
        </div>
        <RFQCreateForm />
      </div>
    </div>
  );
}
```

**Step 2: Vérifier TypeScript**
```bash
cd /Users/tomlibion/Downloads/EnergyHub-main && npx tsc --noEmit 2>&1 | head -10
```
Attendu : seule erreur possible = module `./RFQCreateForm` introuvable (acceptable).

**Step 3: Commit**
```bash
git add src/app/rfq/create/page.tsx
git commit -m "feat: F5 rfq create page server component"
```

---

### Task 3 : Client Component `RFQCreateForm.tsx`

**Files:**
- Create: `src/app/rfq/create/RFQCreateForm.tsx`

**Step 1: Créer le fichier complet**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  type: string;
  title: string;
  description: string;
  requirements: string;
  target_actor_types: string[];
  target_technologies: string[];
  target_regions: string[];
  budget_range: string;
  deadline: string;
  location: string;
  tags: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",          icon: "⚡" },
  installer:       { label: "Installateur",         icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",      icon: "💻" },
  investor:        { label: "Investisseur",          icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie", icon: "🏭" },
  esco:            { label: "ESCO / Consultant",     icon: "🎯" },
  greentech:       { label: "GreenTech",             icon: "🌱" },
};
const ACTOR_TYPES = Object.entries(ACTOR_LABELS);
const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];

// ─── TagInput ─────────────────────────────────────────────────────────────────

function TagInput({
  label, values, onChange, placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-500 hover:text-white transition-colors ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Taper + Entrée"}
        />
        <button
          type="button"
          onClick={add}
          className="btn-secondary text-xs px-3 py-2"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ["Infos de base", "Ciblage", "Révision"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              done ? "bg-green-400 text-black" :
              active ? "bg-yellow-500 text-black" :
              "bg-slate-800 text-slate-500"
            }`}>
              {done ? "✓" : n}
            </div>
            <span className={`text-sm hidden sm:block ${active ? "text-white" : done ? "text-green-400" : "text-slate-600"}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? "bg-green-400" : "bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── RFQCreateForm ────────────────────────────────────────────────────────────

export default function RFQCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    type: "rfq",
    title: "",
    description: "",
    requirements: "",
    target_actor_types: [],
    target_technologies: [],
    target_regions: [],
    budget_range: "",
    deadline: "",
    location: "",
    tags: [],
  });

  const set = (field: keyof FormData, value: string | string[]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleArray = (field: keyof FormData, value: string) => {
    const arr = form[field] as string[];
    set(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  // ── Validation étape 1 ──
  const step1Valid = form.title.trim().length > 0 && form.description.trim().length > 0;

  // ── Soumission ──
  const submit = async (publish: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
          publish,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      router.push(`/rfq/${data.rfq.id}`);
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ÉTAPE 1 — Infos de base
  // ──────────────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div>
        <StepIndicator step={1} />
        <div className="card p-6 space-y-5">
          {/* Type */}
          <div>
            <label className="label">Type d'appel d'offres</label>
            <div className="flex gap-3 mt-2">
              {[["rfq", "RFQ", "Appel d'offres"], ["rfi", "RFI", "Demande d'info"], ["rfp", "RFP", "Proposition"]].map(([val, badge, desc]) => (
                <label key={val} className={`flex-1 cursor-pointer card p-3 text-center transition-colors ${
                  form.type === val ? "border-yellow-500/50 bg-yellow-500/5" : "hover:border-slate-700"
                }`}>
                  <input
                    type="radio"
                    name="rfq-type"
                    value={val}
                    checked={form.type === val}
                    onChange={() => set("type", val)}
                    className="sr-only"
                  />
                  <div className={`text-xs font-bold mb-0.5 ${form.type === val ? "text-yellow-500" : "text-slate-400"}`}>{badge}</div>
                  <div className="text-[10px] text-slate-600">{desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="label">Titre <span className="text-red-400">*</span></label>
            <input
              className="input"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Ex: Recherche installateur bornes de recharge Wallonie"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="text-red-400">*</span></label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Décrivez le contexte, les objectifs et les livrables attendus..."
            />
          </div>

          {/* Exigences */}
          <div>
            <label className="label">Exigences techniques <span className="text-slate-600 font-normal">(optionnel)</span></label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.requirements}
              onChange={e => set("requirements", e.target.value)}
              placeholder="Certifications requises, normes, contraintes techniques..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ÉTAPE 2 — Ciblage
  // ──────────────────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div>
        <StepIndicator step={2} />
        <div className="card p-6 space-y-6">
          {/* Acteurs ciblés */}
          <div>
            <label className="label">Types d'acteurs ciblés</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className={`flex items-center gap-2.5 cursor-pointer p-2 rounded-lg border transition-colors ${
                  form.target_actor_types.includes(value)
                    ? "border-yellow-500/40 bg-yellow-500/5 text-white"
                    : "border-slate-800 hover:border-slate-700 text-slate-400"
                }`}>
                  <input
                    type="checkbox"
                    checked={form.target_actor_types.includes(value)}
                    onChange={() => toggleArray("target_actor_types", value)}
                    className="accent-yellow-500 shrink-0"
                  />
                  <span className="text-sm">{icon} {label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Régions */}
          <div>
            <label className="label">Régions ciblées</label>
            <div className="flex gap-3 mt-2">
              {REGIONS.map(r => (
                <label key={r} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm transition-colors ${
                  form.target_regions.includes(r)
                    ? "border-yellow-500/40 bg-yellow-500/5 text-white"
                    : "border-slate-800 hover:border-slate-700 text-slate-400"
                }`}>
                  <input
                    type="checkbox"
                    checked={form.target_regions.includes(r)}
                    onChange={() => toggleArray("target_regions", r)}
                    className="accent-yellow-500"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <TagInput
            label="Technologies ciblées"
            values={form.target_technologies}
            onChange={v => set("target_technologies", v)}
            placeholder="Ex: pompe à chaleur, bornes EV..."
          />

          {/* Budget */}
          <div>
            <label className="label">Budget <span className="text-slate-600 font-normal">(optionnel)</span></label>
            <input
              className="input"
              value={form.budget_range}
              onChange={e => set("budget_range", e.target.value)}
              placeholder="Ex: 50k–100k€, < 20 000€..."
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="label">Date limite <span className="text-slate-600 font-normal">(optionnel)</span></label>
            <input
              type="date"
              className="input"
              value={form.deadline}
              onChange={e => set("deadline", e.target.value)}
            />
          </div>

          {/* Localisation */}
          <div>
            <label className="label">Localisation <span className="text-slate-600 font-normal">(optionnel)</span></label>
            <input
              className="input"
              value={form.location}
              onChange={e => set("location", e.target.value)}
              placeholder="Ex: Liège, Wallonie"
            />
          </div>

          {/* Tags */}
          <TagInput
            label="Tags"
            values={form.tags}
            onChange={v => set("tags", v)}
            placeholder="Ex: solaire, audit énergétique..."
          />
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => setStep(1)} className="btn-secondary">
            ← Précédent
          </button>
          <button onClick={() => setStep(3)} className="btn-primary">
            Suivant →
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ÉTAPE 3 — Révision
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <StepIndicator step={3} />
      <div className="card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white mb-4">Récapitulatif</h2>

        <Row label="Type" value={form.type.toUpperCase()} />
        <Row label="Titre" value={form.title} />
        <Row label="Description" value={form.description} multiline />
        {form.requirements && <Row label="Exigences" value={form.requirements} multiline />}

        {form.target_actor_types.length > 0 && (
          <Row label="Acteurs ciblés" value={form.target_actor_types.map(t => ACTOR_LABELS[t]?.label || t).join(", ")} />
        )}
        {form.target_regions.length > 0 && (
          <Row label="Régions" value={form.target_regions.join(", ")} />
        )}
        {form.target_technologies.length > 0 && (
          <Row label="Technologies" value={form.target_technologies.join(", ")} />
        )}
        {form.budget_range && <Row label="Budget" value={form.budget_range} />}
        {form.deadline && <Row label="Deadline" value={new Date(form.deadline).toLocaleDateString("fr-BE")} />}
        {form.location && <Row label="Localisation" value={form.location} />}
        {form.tags.length > 0 && <Row label="Tags" value={form.tags.join(", ")} />}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-4 gap-3">
        <button
          onClick={() => setStep(2)}
          className="btn-secondary"
          disabled={loading}
        >
          ← Précédent
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => submit(false)}
            className="btn-secondary"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Sauvegarder en draft"}
          </button>
          <button
            onClick={() => submit(true)}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Publication..." : "Publier maintenant →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4 py-2 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-300 flex-1 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</span>
    </div>
  );
}
```

**Step 2: Vérifier TypeScript**
```bash
cd /Users/tomlibion/Downloads/EnergyHub-main && npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

**Step 3: Commit**
```bash
git add src/app/rfq/create/RFQCreateForm.tsx
git commit -m "feat: F5 rfq create wizard form 3 steps"
```

---

### Task 4 : Push & vérification

**Step 1: Push**
```bash
git push origin main
```

**Step 2: Vérifier sur Vercel**
- Build logs sans erreur TypeScript
- `/rfq/create` → redirect `/pricing` si non-Pro
- `/rfq/create` → affiche wizard si Pro
- Étape 1 : "Suivant" désactivé si titre ou description vide
- Étape 3 : "Publier" → redirect vers `/rfq/[id]` (404 jusqu'à F8)
- Étape 3 : "Sauvegarder en draft" → redirect vers `/rfq/[id]` (404 jusqu'à F8)
