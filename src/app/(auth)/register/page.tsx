"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACTOR_TYPES = [
  { value: "industrial",      icon: "⚡", label: "Industriel",           desc: "Grand consommateur d'énergie" },
  { value: "installer",       icon: "🔧", label: "Installateur",          desc: "Intégrateur hardware certifié" },
  { value: "software_editor", icon: "💻", label: "Éditeur logiciel",       desc: "SCADA, EMS, SaaS énergie" },
  { value: "investor",        icon: "📈", label: "Fonds d'investissement", desc: "Infrastructure & capital" },
  { value: "energy_provider", icon: "🏭", label: "Fournisseur d'énergie",  desc: "Utility, agrégateur" },
  { value: "greentech",       icon: "🌱", label: "GreenTech / Startup",    desc: "Innovation énergétique" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [actorType, setActorType] = useState("");
  const [form, setForm] = useState({ orgName: "", email: "", password: "", firstName: "", lastName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Créer le compte auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.firstName, last_name: form.lastName },
      },
    });
    if (authError || !data.user) { setError(authError?.message || "Erreur"); setLoading(false); return; }

    // 2. Créer l'organisation
    const slug = form.orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: form.orgName, slug: `${slug}-${Date.now()}`, actor_type: actorType })
      .select()
      .single();

    if (orgError || !org) { setError("Erreur création organisation"); setLoading(false); return; }

    // 3. Lier le membre à l'org
    await supabase.from("members").upsert({
      id: data.user.id,
      organization_id: org.id,
      email: form.email,
      first_name: form.firstName,
      last_name: form.lastName,
      is_org_admin: true,
    });

    // 4. Déclencher l'agent onboarding
    await fetch("/api/agents/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: org.id,
        actorType,
        profileData: { name: form.orgName },
        currentStep: 0,
      }),
    });

    router.push("/dashboard?welcome=1");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-amber to-brand-red flex items-center justify-center text-xl mx-auto mb-4">⚡</div>
          <h1 className="font-display text-2xl font-bold text-white">Rejoindre EnergyHub</h1>
          <p className="text-slate-500 text-sm mt-1">Gratuit pour toujours · Aucune CB requise</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= n ? "bg-brand-amber text-black" : "bg-surface-3 text-slate-500"
              }`}>{n}</div>
              {n < 2 && <div className={`w-12 h-px ${step > n ? "bg-brand-amber" : "bg-surface-3"}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* STEP 1 — Type d'acteur */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-white mb-1">Qui êtes-vous ?</h2>
              <p className="text-sm text-slate-500 mb-5">Choisissez votre profil pour personnaliser votre expérience.</p>
              <div className="grid grid-cols-2 gap-3">
                {ACTOR_TYPES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setActorType(a.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      actorType === a.value
                        ? "border-brand-amber bg-brand-amber/8"
                        : "border-surface-3 bg-surface-2 hover:border-surface-4"
                    }`}
                  >
                    <span className="text-xl block mb-2">{a.icon}</span>
                    <div className="text-sm font-semibold text-white">{a.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!actorType}
                className="btn-primary w-full py-3 mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* STEP 2 — Infos compte */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="font-semibold text-white mb-1">Créer votre compte</h2>
              {error && (
                <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jean" required />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Dupont" required />
                </div>
              </div>
              <div>
                <label className="label">Nom de l'organisation</label>
                <input className="input" value={form.orgName} onChange={e => setForm({...form, orgName: e.target.value})} placeholder="Votre entreprise" required />
              </div>
              <div>
                <label className="label">Email professionnel</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="vous@entreprise.be" required />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="8 caractères minimum" minLength={8} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Retour</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                  {loading ? "Création..." : "Créer mon compte →"}
                </button>
              </div>
              <p className="text-xs text-slate-600 text-center">
                En vous inscrivant, vous acceptez nos{" "}
                <Link href="/cgu" className="text-slate-400 hover:text-white">CGU</Link>
                {" "}et notre{" "}
                <Link href="/privacy" className="text-slate-400 hover:text-white">politique de confidentialité</Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-brand-amber hover:underline font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
