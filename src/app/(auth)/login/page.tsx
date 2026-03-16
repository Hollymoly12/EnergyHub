"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden md:flex w-[45%] relative flex-col justify-between p-12 bg-primary overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(184,255,60,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <span className="material-symbols-outlined text-primary font-bold text-xl">bolt</span>
            </div>
            <span className="text-white font-extrabold text-lg font-display">EnergyHub</span>
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-white font-extrabold text-4xl leading-tight mb-6 font-display">
            La marketplace de la transition énergétique belge
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Matching IA, RFQ automatisés et module d&apos;investissement pour accélérer votre transition énergétique.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex flex-col gap-4">
          {[
            { icon: "factory", label: "6 types d'acteurs" },
            { icon: "psychology", label: "Score IA 0–100" },
            { icon: "location_on", label: "3 régions couvertes" },
          ].map(({ icon, label }) => (
            <div key={icon} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-accent text-lg">{icon}</span>
              <span className="text-white/60 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background-light">
        <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-sm border border-slate-100">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-accent text-base font-bold">bolt</span>
            </div>
            <span className="font-extrabold text-primary text-base font-display">EnergyHub</span>
          </div>

          <h2 className="text-3xl font-extrabold text-primary mb-1 font-display">Connexion</h2>
          <p className="text-slate-500 text-sm mb-8">Bienvenue sur EnergyHub</p>

          {error && (
            <div className="alert-error mb-6">{error}</div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@entreprise.be"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label" style={{ marginBottom: 0 }}>Mot de passe</label>
                <Link href="/forgot-password" className="text-primary text-xs font-semibold hover:opacity-70 transition-opacity">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pl-10 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs">ou</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="text-center text-sm text-slate-500 mt-8">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-primary font-semibold hover:opacity-70 transition-opacity">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
