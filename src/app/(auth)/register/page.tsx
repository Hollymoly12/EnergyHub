"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACTOR_TYPES = [
  { value: "industrial",      icon: "🏭", label: "Industriel",           desc: "Grand consommateur d'énergie" },
  { value: "installer",       icon: "🔧", label: "Installateur",          desc: "Intégrateur hardware certifié" },
  { value: "software_editor", icon: "💻", label: "Éditeur logiciel",       desc: "SCADA, EMS, SaaS énergie" },
  { value: "investor",        icon: "💼", label: "Investisseur",           desc: "Infrastructure & capital" },
  { value: "energy_provider", icon: "⚡", label: "Fournisseur d'énergie",  desc: "Utility, agrégateur" },
  { value: "greentech",       icon: "🌿", label: "Greentech",              desc: "Innovation énergétique" },
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundColor: "#07090F",
        backgroundImage: `radial-gradient(circle at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 60%),
          radial-gradient(#1E2D45 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 28px 28px",
      }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" }}
          >
            ⚡
          </div>
          <span
            className="text-lg font-bold tracking-wide"
            style={{ fontFamily: "Syne, sans-serif", color: "#F1F5F9" }}
          >
            EnergyHub
          </span>
        </Link>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[
            { n: 1, label: "Compte" },
            { n: 2, label: "Organisation" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    fontFamily: "Space Mono, monospace",
                    backgroundColor: step >= n ? "rgba(245,158,11,0.15)" : "rgba(30,45,69,0.5)",
                    border: `1px solid ${step >= n ? "#F59E0B" : "#1E2D45"}`,
                    color: step >= n ? "#F59E0B" : "#475569",
                  }}
                >
                  <span style={{ fontFamily: "Space Mono, monospace" }}>
                    0{n}
                  </span>
                  <span style={{ fontFamily: "DM Sans, sans-serif" }}>{label}</span>
                </div>
              </div>
              {i < 1 && (
                <div
                  className="w-10 h-px mx-2"
                  style={{ backgroundColor: step > n ? "#F59E0B" : "#1E2D45" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="p-8"
          style={{
            backgroundColor: "#0D1421",
            border: "1px solid #1E2D45",
            borderRadius: "16px",
          }}
        >
          {/* STEP 1 — Type d'acteur */}
          {step === 1 && (
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "Syne, sans-serif", color: "#F1F5F9" }}
              >
                Qui êtes-vous ?
              </h2>
              <p className="text-sm mb-6" style={{ fontFamily: "DM Sans, sans-serif", color: "#64748B" }}>
                Choisissez votre profil pour personnaliser votre expérience.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {ACTOR_TYPES.map((a) => {
                  const selected = actorType === a.value;
                  return (
                    <button
                      key={a.value}
                      onClick={() => setActorType(a.value)}
                      className="p-4 text-left transition-all"
                      style={{
                        backgroundColor: selected ? "rgba(245,158,11,0.08)" : "rgba(13,20,33,0.6)",
                        border: `1px solid ${selected ? "#F59E0B" : "#1E2D45"}`,
                        borderRadius: "10px",
                        boxShadow: selected ? "0 0 12px rgba(245,158,11,0.12)" : "none",
                        outline: "none",
                      }}
                    >
                      <span className="text-2xl block mb-2">{a.icon}</span>
                      <div
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          color: selected ? "#F59E0B" : "#F1F5F9",
                        }}
                      >
                        {a.label}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ fontFamily: "DM Sans, sans-serif", color: "#475569" }}
                      >
                        {a.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!actorType}
                className="btn-primary w-full py-3 mt-6"
                style={{ opacity: actorType ? 1 : 0.4, cursor: actorType ? "pointer" : "not-allowed" }}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* STEP 2 — Infos compte */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="mb-2">
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: "Syne, sans-serif", color: "#F1F5F9" }}
                >
                  Créer votre compte
                </h2>
                <p className="text-sm" style={{ fontFamily: "DM Sans, sans-serif", color: "#64748B" }}>
                  Gratuit pour toujours · Aucune CB requise
                </p>
              </div>

              {error && (
                <div
                  className="text-xs rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input
                    className="input"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    className="input"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Nom de l&apos;organisation</label>
                <input
                  className="input"
                  value={form.orgName}
                  onChange={e => setForm({ ...form, orgName: e.target.value })}
                  placeholder="Votre entreprise"
                  required
                />
              </div>

              <div>
                <label className="label">Email professionnel</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@entreprise.be"
                  required
                />
              </div>

              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="8 caractères minimum"
                  minLength={8}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-3"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Création..." : "Créer mon compte →"}
                </button>
              </div>

              <p
                className="text-xs text-center pt-1"
                style={{ fontFamily: "DM Sans, sans-serif", color: "#334155" }}
              >
                En vous inscrivant, vous acceptez nos{" "}
                <Link href="/cgu" className="hover:text-white transition-colors" style={{ color: "#64748B" }}>
                  CGU
                </Link>
                {" "}et notre{" "}
                <Link href="/privacy" className="hover:text-white transition-colors" style={{ color: "#64748B" }}>
                  politique de confidentialité
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ fontFamily: "DM Sans, sans-serif", color: "#475569" }}
        >
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline transition-colors"
            style={{ color: "#F59E0B" }}
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
