import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080C14", color: "#E2E8F0", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
          EnergyHub
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", marginBottom: 40 }}>
          La marketplace de la transition énergétique belge
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/register" style={{ background: "#F59E0B", color: "#000", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
            S'inscrire gratuitement →
          </Link>
          <Link href="/login" style={{ border: "1px solid #334155", color: "#e2e8f0", padding: "12px 28px", borderRadius: 8, textDecoration: "none" }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
