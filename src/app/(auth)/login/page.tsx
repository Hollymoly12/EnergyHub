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
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF7", display: "flex" }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#16523A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1 8h5.5L5 13l8-8H7.5L9 1z" fill="#B8FF3C"/>
              </svg>
            </div>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 800, fontSize: 16, color: "#0D0D0D" }}>EnergyHub</span>
          </Link>

          <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 32, fontWeight: 800, color: "#0D0D0D", letterSpacing: "-0.025em", marginBottom: 8 }}>Connexion</h1>
          <p style={{ fontSize: 14, color: "#6B6560", marginBottom: 32 }}>Accédez à votre espace EnergyHub</p>

          {error && (
            <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#991B1B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.be" required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, width: "100%", justifyContent: "center" }}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E2DDD6" }} />
            <span style={{ fontSize: 12, color: "#B8B2AB" }}>ou</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E2DDD6" }} />
          </div>

          <button onClick={handleGoogle} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>

          <p style={{ textAlign: "center" as const, fontSize: 14, color: "#6B6560", marginTop: 28 }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "#16523A", textDecoration: "none", fontWeight: 600 }}>Créer un compte →</Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 440, backgroundColor: "#16523A", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ maxWidth: 320, textAlign: "center" as const }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: "rgba(184,255,60,0.15)", border: "1px solid rgba(184,255,60,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
            <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L1 8h5.5L5 13l8-8H7.5L9 1z" fill="#B8FF3C"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 16, lineHeight: 1.15 }}>
            La marketplace de l&apos;énergie belge
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
            Matching IA, RFQ automatisés et module d&apos;investissement pour accélérer la transition énergétique.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {["6 types d'acteurs", "Score IA 0-100", "3 régions", "Gratuit"].map(feat => (
              <div key={feat} style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{feat}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
