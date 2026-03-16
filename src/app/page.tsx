import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#07090F", color: "#F1F5F9", fontFamily: "DM Sans, sans-serif", minHeight: "100vh" }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: "1px solid #1E2D45", backgroundColor: "rgba(7,9,15,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: "bold", color: "#000" }}>⚡</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>EnergyHub</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/directory" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", padding: "6px 14px", borderRadius: 8, transition: "color 0.15s" }}>Annuaire</Link>
            <Link href="/rfq" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", padding: "6px 14px", borderRadius: 8 }}>RFQ</Link>
            <Link href="/pricing" style={{ color: "#94A3B8", fontSize: 14, textDecoration: "none", padding: "6px 14px", borderRadius: 8 }}>Tarifs</Link>
            <Link href="/login" style={{ color: "#F1F5F9", fontSize: 14, textDecoration: "none", padding: "7px 16px", borderRadius: 8, border: "1px solid #1E2D45", marginLeft: 8 }}>Connexion</Link>
            <Link href="/register" style={{ backgroundColor: "#F59E0B", color: "#000", fontSize: 14, fontWeight: 600, textDecoration: "none", padding: "7px 18px", borderRadius: 8 }}>Rejoindre →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: 100, paddingBottom: 100 }}>
        {/* Dot grid background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #1A2540 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.6 }} />
        {/* Amber glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(245,158,11,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#F59E0B", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F59E0B", fontFamily: "Syne, sans-serif" }}>Marketplace B2B · Belgique</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 24, color: "#fff" }}>
            La marketplace de la<br />
            <span style={{ color: "#F59E0B" }}>transition énergétique</span><br />
            belge
          </h1>

          <p style={{ fontSize: 18, color: "#94A3B8", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Connectez industriels, installateurs, investisseurs et greentechs. Matching IA, RFQ automatisés, deals d&apos;investissement.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <Link href="/register" style={{ backgroundColor: "#F59E0B", color: "#000", fontWeight: 700, fontSize: 15, textDecoration: "none", padding: "13px 28px", borderRadius: 10, fontFamily: "DM Sans, sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Créer un compte gratuit →
            </Link>
            <Link href="/directory" style={{ color: "#F1F5F9", fontWeight: 500, fontSize: 15, textDecoration: "none", padding: "13px 28px", borderRadius: 10, border: "1px solid #1E2D45", fontFamily: "DM Sans, sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Voir l&apos;annuaire
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, justifyContent: "center", flexWrap: "wrap", borderTop: "1px solid #1E2D45", paddingTop: 40 }}>
            {[
              { value: "6", label: "types d'acteurs" },
              { value: "3", label: "régions belges" },
              { value: "IA", label: "matching intelligent" },
              { value: "€0", label: "pour démarrer" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "0 40px", borderRight: i < 3 ? "1px solid #1E2D45" : "none", textAlign: "center" }}>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 28, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Actor types ── */}
      <section style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 16, height: 1, backgroundColor: "rgba(245,158,11,0.6)", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F59E0B", fontFamily: "Syne, sans-serif" }}>Les acteurs</span>
          </div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
            Une plateforme pour tout l&apos;écosystème
          </h2>
          <p style={{ color: "#64748B", fontSize: 16 }}>6 types d&apos;acteurs interconnectés par l&apos;intelligence artificielle</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { icon: "🏭", label: "Industriels", color: "#F59E0B", desc: "Publiez vos besoins énergétiques, trouvez des solutions certifiées et optimisez votre transition." },
            { icon: "🔧", label: "Installateurs", color: "#22C55E", desc: "Répondez aux appels d'offres qualifiés et développez votre portefeuille de projets." },
            { icon: "💻", label: "Éditeurs logiciels", color: "#818CF8", desc: "Distribuez vos solutions auprès des acteurs de la transition énergétique." },
            { icon: "💼", label: "Fonds d'investissement", color: "#F59E0B", desc: "Sourcez des projets verts, évaluez les deals avec l'IA et gérez vos intérêts." },
            { icon: "⚡", label: "Fournisseurs d'énergie", color: "#22C55E", desc: "Connectez-vous aux industriels et proposez vos offres sur-mesure." },
            { icon: "🌿", label: "Greentechs", color: "#818CF8", desc: "Faites connaître vos innovations et trouvez des partenaires industriels." },
          ].map((actor) => (
            <div key={actor.label} style={{ backgroundColor: "#0D1421", border: "1px solid #1E2D45", borderRadius: 12, padding: "24px" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{actor.icon}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: actor.color, marginBottom: 8 }}>{actor.label}</div>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>{actor.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "80px 24px", backgroundColor: "#0D1421", borderTop: "1px solid #1E2D45", borderBottom: "1px solid #1E2D45" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 16, height: 1, backgroundColor: "rgba(245,158,11,0.6)", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#F59E0B", fontFamily: "Syne, sans-serif" }}>Comment ça marche</span>
            </div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Opérationnel en 3 étapes
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              { n: "01", title: "Créez votre profil", desc: "L'agent IA analyse votre organisation et complète automatiquement votre profil pour maximiser votre visibilité." },
              { n: "02", title: "Publiez ou répondez", desc: "Créez des RFQ ciblés ou répondez aux appels d'offres qui correspondent à vos compétences." },
              { n: "03", title: "Matchs IA", desc: "L'algorithme calcule un score de compatibilité 0-100 et vous met en relation avec les meilleurs partenaires." },
            ].map((step) => (
              <div key={step.n} style={{ position: "relative", padding: "32px 28px", backgroundColor: "#131C2E", borderRadius: 12, border: "1px solid #1E2D45" }}>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 48, fontWeight: 700, color: "rgba(245,158,11,0.12)", position: "absolute", top: 20, right: 24, lineHeight: 1 }}>{step.n}</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, fontWeight: 700, color: "#F59E0B", letterSpacing: "0.1em", marginBottom: 12 }}>{step.n}</div>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA finale ── */}
      <section style={{ padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #1A2540 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.4 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 20 }}>
            Rejoignez l&apos;écosystème<br /><span style={{ color: "#F59E0B" }}>énergie belge</span>
          </h2>
          <p style={{ color: "#64748B", fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Gratuit pour démarrer. Aucune carte de crédit requise.
          </p>
          <Link href="/register" style={{ backgroundColor: "#F59E0B", color: "#000", fontWeight: 700, fontSize: 16, textDecoration: "none", padding: "14px 32px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "DM Sans, sans-serif" }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #1E2D45", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#000" }}>⚡</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>EnergyHub</span>
            <span style={{ color: "#1E2D45", margin: "0 8px" }}>|</span>
            <span style={{ fontSize: 13, color: "#4A5568" }}>Marketplace B2B · Belgique</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Annuaire", "/directory"], ["RFQ", "/rfq"], ["Investissement", "/investment"], ["Tarifs", "/pricing"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "#4A5568", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
