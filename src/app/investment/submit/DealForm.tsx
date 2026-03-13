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
            <input
              type="checkbox"
              id="requires_nda"
              checked={form.requires_nda}
              onChange={(e) => set("requires_nda", e.target.checked)}
              className="sr-only"
            />
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
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Titre</dt><dd className="text-slate-300">{form.title || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Description</dt><dd className="text-slate-300 line-clamp-2">{form.description || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Type</dt><dd className="text-slate-300">{form.project_type || "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Localisation</dt><dd className="text-slate-300">{form.location || "—"}</dd></div>
              {form.capacity_mw && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Capacité</dt><dd className="text-slate-300">{form.capacity_mw} MW</dd></div>}
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Montant</dt><dd className="text-slate-300">{form.funding_amount ? `${Number(form.funding_amount).toLocaleString("fr-FR")} €` : "—"}</dd></div>
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Financement</dt><dd className="text-slate-300">{form.funding_type || "—"}</dd></div>
              {form.series && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Série</dt><dd className="text-slate-300">{form.series}</dd></div>}
              {form.irr_target && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">IRR cible</dt><dd className="text-slate-300">{form.irr_target}%</dd></div>}
              {form.duration_years && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Durée</dt><dd className="text-slate-300">{form.duration_years} ans</dd></div>}
              {form.current_investors && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Investisseurs</dt><dd className="text-slate-300">{form.current_investors}</dd></div>}
              {form.pitch_deck_url && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Pitch deck</dt><dd className="text-slate-300 truncate">{form.pitch_deck_url}</dd></div>}
              {form.financial_model_url && <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">Modèle financier</dt><dd className="text-slate-300 truncate">{form.financial_model_url}</dd></div>}
              <div className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">NDA</dt><dd className="text-slate-300">{form.requires_nda ? "Oui" : "Non"}</dd></div>
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
