"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ACTOR_TYPES = [
  { value: "industrial",      num: "01", label: "Industriel",           desc: "Production et consommation d'énergie à grande échelle" },
  { value: "installer",       num: "02", label: "Installateur",          desc: "Installation de systèmes énergétiques certifiés" },
  { value: "software_editor", num: "03", label: "Éditeur logiciel",       desc: "Solutions logicielles pour la gestion énergétique" },
  { value: "investor",        num: "04", label: "Investisseur",           desc: "Financement de projets de transition énergétique" },
  { value: "energy_provider", num: "05", label: "Fournisseur d'énergie",  desc: "Production et distribution d'énergie" },
  { value: "greentech",       num: "06", label: "Greentech",              desc: "Technologies innovantes pour l'environnement" },
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
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FAFAF7" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#16523A" }}
          >
            <span style={{ color: "#B8FF3C", fontSize: "14px", fontWeight: 700, fontFamily: "Bricolage Grotesque, sans-serif" }}>E</span>
          </div>
          <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 700, color: "#0D0D0D", fontSize: "16px" }}>
            EnergyHub
          </span>
        </Link>
        <Link
          href="/"
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "13px", color: "#6B6560" }}
          className="hover:opacity-70 transition-opacity"
        >
          Retour au site
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Step pills */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[
              { n: 1, label: "Compte" },
              { n: 2, label: "Organisation" },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center">
                <div
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    backgroundColor: step >= n ? "#16523A" : "#F3F1EC",
                    border: `1px solid ${step >= n ? "#16523A" : "#E2DDD6"}`,
                    color: step >= n ? "#FAFAF7" : "#6B6560",
                  }}
                >
                  <span style={{ fontFamily: "Fira Code, monospace", fontSize: "11px" }}>0{n}</span>
                  <span>— {label}</span>
                </div>
                {i < 1 && (
                  <div
                    className="w-8 h-px mx-2"
                    style={{ backgroundColor: step > n ? "#16523A" : "#E2DDD6" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div
            className="p-8"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2DDD6",
              borderRadius: "16px",
            }}
          >
            {/* STEP 1 — Type d'acteur */}
            {step === 1 && (
              <div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ fontFamily: "Bricolage Grotesque, sans-serif", color: "#0D0D0D" }}
                >
                  Qui êtes-vous ?
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#6B6560" }}>
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
                          backgroundColor: selected ? "#D4E8DF" : "#F3F1EC",
                          border: `1.5px solid ${selected ? "#16523A" : "#E2DDD6"}`,
                          borderRadius: "12px",
                          outline: "none",
                        }}
                      >
                        <span
                          className="block mb-2 text-xs"
                          style={{ fontFamily: "Fira Code, monospace", color: selected ? "#16523A" : "#6B6560" }}
                        >
                          {a.num}
                        </span>
                        <div
                          className="text-sm font-bold"
                          style={{
                            fontFamily: "Bricolage Grotesque, sans-serif",
                            color: selected ? "#16523A" : "#0D0D0D",
                          }}
                        >
                          {a.label}
                        </div>
                        <div
                          className="text-xs mt-1 leading-snug"
                          style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#6B6560" }}
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
                  Continuer
                </button>
              </div>
            )}

            {/* STEP 2 — Infos compte */}
            {step === 2 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="mb-2">
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: "Bricolage Grotesque, sans-serif", color: "#0D0D0D" }}
                  >
                    Créer votre compte
                  </h2>
                  <p className="text-sm" style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#6B6560" }}>
                    Gratuit pour toujours · Aucune CB requise
                  </p>
                </div>

                {error && (
                  <div
                    className="text-xs rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#DC2626",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
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
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3"
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </div>

                <p
                  className="text-xs text-center pt-1"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#6B6560" }}
                >
                  En vous inscrivant, vous acceptez nos{" "}
                  <Link href="/cgu" className="underline hover:opacity-70 transition-opacity" style={{ color: "#16523A" }}>
                    CGU
                  </Link>
                  {" "}et notre{" "}
                  <Link href="/privacy" className="underline hover:opacity-70 transition-opacity" style={{ color: "#16523A" }}>
                    politique de confidentialité
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Footer link */}
          <p
            className="text-center text-sm mt-6"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif", color: "#6B6560" }}
          >
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "#16523A" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
