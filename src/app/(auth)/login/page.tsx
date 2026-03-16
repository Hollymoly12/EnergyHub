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
    <div style={{ minHeight: "100vh", backgroundColor: "#07090F", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, #1A2540 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.5, pointerEvents: "none" }} />
      {/* Amber glow */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#000" }}>⚡</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>EnergyHub</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#0D1421", border: "1px solid #1E2D45", borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Connexion</h1>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 28 }}>Accédez à votre espace EnergyHub</p>

          {error && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#EF4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <div style={{ flex: 1, height: 1, backgroundColor: "#1E2D45" }} />
            <span style={{ fontSize: 12, color: "#4A5568" }}>ou</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#1E2D45" }} />
          </div>

          <button onClick={handleGoogle} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 14, color: "#4A5568", marginTop: 24 }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Créer un compte →</Link>
        </p>
      </div>
    </div>
  );
}
