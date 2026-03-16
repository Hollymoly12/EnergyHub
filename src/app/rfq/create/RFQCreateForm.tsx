"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  type: "rfq" | "rfi" | "rfp";
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
  industrial:      { label: "Industriel",           icon: "factory" },
  installer:       { label: "Installateur",          icon: "handyman" },
  software_editor: { label: "Éditeur logiciel",       icon: "code" },
  investor:        { label: "Investisseur",           icon: "trending_up" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "bolt" },
  esco:            { label: "ESCO / Consultant",      icon: "psychology" },
  greentech:       { label: "GreenTech",              icon: "eco" },
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
      <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: "rgba(22,82,58,0.1)", color: "#16523A" }}
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:opacity-60 transition-opacity"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Taper + Entrée"}
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#16523A", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">add</span>
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              done ? "bg-accent text-primary" :
              active ? "bg-primary text-white" :
              "bg-slate-200 text-slate-400"
            }`}>
              {done
                ? <span className="material-symbols-outlined text-sm">check</span>
                : n}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${active ? "text-primary" : done ? "text-primary/60" : "text-slate-400"}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? "bg-accent" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wide text-primary/50 w-36 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-700 flex-1 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</span>
    </div>
  );
}

// ─── RFQCreateForm ────────────────────────────────────────────────────────────

export default function RFQCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loadingAction, setLoadingAction] = useState<"draft" | "publish" | null>(null);
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

  const step1Valid = form.title.trim().length > 0 && form.description.trim().length >= 20;

  const submit = async (publish: boolean) => {
    setLoadingAction(publish ? "publish" : "draft");
    setError("");
    let redirectId: string | null = null;
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
      redirectId = data.rfq.id;
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoadingAction(null);
    }
    if (redirectId) router.push(`/rfq/${redirectId}`);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";

  // ── Étape 1 ──
  if (step === 1) {
    return (
      <div>
        <StepIndicator step={1} />
        <div className="bg-white rounded-3xl p-8 border border-black/5 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-3">Type d'appel d'offres</label>
            <div className="flex gap-3">
              {[["rfq", "RFQ", "Appel d'offres"], ["rfi", "RFI", "Demande d'info"], ["rfp", "RFP", "Proposition"]].map(([val, badge, desc]) => (
                <label key={val} className={`flex-1 cursor-pointer rounded-2xl p-4 text-center border-2 transition-all ${
                  form.type === val
                    ? "border-accent bg-accent/10"
                    : "border-slate-200 hover:border-primary/30"
                }`}>
                  <input
                    type="radio"
                    name="rfq-type"
                    value={val}
                    checked={form.type === val}
                    onChange={() => set("type", val)}
                    className="sr-only"
                  />
                  <div className={`text-sm font-bold mb-0.5 ${form.type === val ? "text-primary" : "text-slate-500"}`}>{badge}</div>
                  <div className="text-[11px] text-slate-400">{desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Titre <span className="text-red-500 normal-case">*</span>
            </label>
            <input
              className={inputClass}
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Ex: Recherche installateur bornes de recharge Wallonie"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Description <span className="text-red-500 normal-case">*</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Décrivez le contexte, les objectifs et les livrables attendus..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Exigences techniques <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.requirements}
              onChange={e => set("requirements", e.target.value)}
              placeholder="Certifications requises, normes, contraintes techniques..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => setStep(2)}
            disabled={!step1Valid}
            title={!step1Valid ? "Titre requis et description (min. 20 caractères)" : undefined}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#16523A" }}
          >
            Suivant
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Étape 2 ──
  if (step === 2) {
    return (
      <div>
        <StepIndicator step={2} />
        <div className="bg-white rounded-3xl p-8 border border-black/5 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-3">Types d'acteurs ciblés</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className={`flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border-2 transition-all ${
                  form.target_actor_types.includes(value)
                    ? "border-accent bg-accent/10 text-primary"
                    : "border-slate-200 hover:border-primary/30 text-slate-600"
                }`}>
                  <input
                    type="checkbox"
                    checked={form.target_actor_types.includes(value)}
                    onChange={() => toggleArray("target_actor_types", value)}
                    className="accent-primary shrink-0"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-3">Régions ciblées</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <label key={r} className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.target_regions.includes(r)
                    ? "border-accent bg-accent/10 text-primary"
                    : "border-slate-200 hover:border-primary/30 text-slate-600"
                }`}>
                  <input
                    type="checkbox"
                    checked={form.target_regions.includes(r)}
                    onChange={() => toggleArray("target_regions", r)}
                    className="accent-primary"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <TagInput
            label="Technologies ciblées"
            values={form.target_technologies}
            onChange={v => set("target_technologies", v)}
            placeholder="Ex: pompe à chaleur, bornes EV..."
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Budget <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.budget_range}
              onChange={e => set("budget_range", e.target.value)}
              placeholder="Ex: 50k–100k€, < 20 000€..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Date limite <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.deadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => set("deadline", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
              Localisation <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
            </label>
            <input
              className={inputClass}
              value={form.location}
              onChange={e => set("location", e.target.value)}
              placeholder="Ex: Liège, Wallonie"
            />
          </div>

          <TagInput
            label="Tags"
            values={form.tags}
            onChange={v => set("tags", v)}
            placeholder="Ex: solaire, audit énergétique..."
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
            style={{ borderColor: "#16523A", color: "#16523A" }}
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Précédent
          </button>
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16523A" }}
          >
            Suivant
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Étape 3 ──
  return (
    <div>
      <StepIndicator step={3} />
      <div className="bg-white rounded-3xl p-8 border border-black/5 space-y-1">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Récapitulatif</h2>

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
        {form.deadline && <Row label="Deadline" value={form.deadline.split("-").reverse().join("/")} />}
        {form.location && <Row label="Localisation" value={form.location} />}
        {form.tags.length > 0 && <Row label="Tags" value={form.tags.join(", ")} />}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-6 gap-3">
        <button
          onClick={() => setStep(2)}
          disabled={loadingAction !== null}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#16523A", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Précédent
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => submit(false)}
            disabled={loadingAction !== null}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50 disabled:opacity-50"
            style={{ borderColor: "#16523A", color: "#16523A" }}
          >
            <span className="material-symbols-outlined text-base">save</span>
            {loadingAction === "draft" ? "Enregistrement..." : "Sauvegarder en draft"}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={loadingAction !== null}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#16523A" }}
          >
            <span className="material-symbols-outlined text-base">publish</span>
            {loadingAction === "publish" ? "Publication..." : "Publier maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
