import Link from "next/link";

export default function LandingPage() {
  const actors = [
    { n: "01", title: "Industriels", desc: "Publiez vos besoins énergétiques et trouvez des solutions certifiées pour votre transition." },
    { n: "02", title: "Installateurs", desc: "Répondez aux appels d'offres qualifiés et développez votre portefeuille de projets." },
    { n: "03", title: "Éditeurs logiciels", desc: "Distribuez vos solutions auprès des acteurs de la transition énergétique belge." },
    { n: "04", title: "Fonds d'investissement", desc: "Sourcez des projets verts, évaluez les deals avec l'IA et gérez vos intérêts." },
    { n: "05", title: "Fournisseurs d'énergie", desc: "Connectez-vous aux industriels et proposez vos offres sur-mesure." },
    { n: "06", title: "Greentechs", desc: "Faites connaître vos innovations et trouvez des partenaires industriels." },
  ];

  const steps = [
    { n: "01", title: "Créez votre profil", desc: "L'agent IA analyse votre organisation et optimise votre visibilité sur la plateforme." },
    { n: "02", title: "Publiez ou répondez", desc: "Créez des RFQ ciblés ou répondez aux appels d'offres correspondant à vos compétences." },
    { n: "03", title: "Matching IA", desc: "L'algorithme calcule un score de compatibilité 0-100 et vous met en relation avec les meilleurs partenaires." },
  ];

  const tickerItems = ["Industriels", "Installateurs", "Éditeurs logiciels", "Fonds d'investissement", "Fournisseurs d'énergie", "Greentechs"];

  return (
    <div style={{ backgroundColor: "#FAFAF7", color: "#0D0D0D", fontFamily: "Plus Jakarta Sans, sans-serif", minHeight: "100vh" }}>

      {/* ── Navbar ── */}
      <nav style={{ borderBottom: "1px solid #E2DDD6", backgroundColor: "rgba(250,250,247,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#16523A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1 8h5.5L5 13l8-8H7.5L9 1z" fill="#B8FF3C" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 800, fontSize: 16, color: "#0D0D0D", letterSpacing: "-0.02em" }}>EnergyHub</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[["Annuaire", "/directory"], ["RFQ", "/rfq"], ["Investissement", "/investment"], ["Tarifs", "/pricing"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ color: "#6B6560", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 500 }}>{label}</Link>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{ color: "#3A3632", fontSize: 14, textDecoration: "none", padding: "8px 16px", borderRadius: 100, border: "1.5px solid #E2DDD6", fontWeight: 500 }}>Connexion</Link>
            <Link href="/register" style={{ backgroundColor: "#16523A", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none", padding: "8px 18px", borderRadius: 100 }}>Rejoindre →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "80px 24px 60px", maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, alignItems: "center" }}>
        {/* Left */}
        <div>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#D4E8DF", borderRadius: 100, padding: "5px 14px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16523A", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#16523A", fontFamily: "Bricolage Grotesque, sans-serif" }}>Marketplace B2B · Belgique</span>
          </div>

          <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(44px, 5.5vw, 72px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em", marginBottom: 24, color: "#0D0D0D" }}>
            La marketplace<br />
            de l&apos;énergie<br />
            <span style={{ color: "#16523A" }}>belge.</span>
          </h1>

          <p style={{ fontSize: 17, color: "#6B6560", maxWidth: 460, lineHeight: 1.7, marginBottom: 36 }}>
            Connectez industriels, installateurs, investisseurs et greentechs. Matching IA, RFQ automatisés, module d&apos;investissement.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 52 }}>
            <Link href="/register" style={{ backgroundColor: "#16523A", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", padding: "12px 26px", borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 8 }}>
              Créer un compte gratuit →
            </Link>
            <Link href="/directory" style={{ color: "#0D0D0D", fontWeight: 500, fontSize: 15, textDecoration: "none", padding: "12px 26px", borderRadius: 100, border: "1.5px solid #E2DDD6", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Voir l&apos;annuaire
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" as const }}>
            {[
              { value: "6", label: "types d'acteurs" },
              { value: "3", label: "régions belges" },
              { value: "0—100", label: "score IA" },
              { value: "€0", label: "pour démarrer" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "Fira Code, monospace", fontSize: 22, fontWeight: 500, color: "#0D0D0D", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#6B6560", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview card */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {/* Mock match card 1 */}
          <div style={{ backgroundColor: "#fff", border: "1px solid #E2DDD6", borderRadius: 16, padding: 20, boxShadow: "0 4px 16px rgba(13,13,13,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#16523A", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: "Bricolage Grotesque, sans-serif", marginBottom: 4 }}>Match IA</div>
                <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 700, fontSize: 16, color: "#0D0D0D" }}>SolarNRG Belgium</div>
                <div style={{ fontSize: 12, color: "#6B6560", marginTop: 2 }}>Installateur · Bruxelles</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontFamily: "Fira Code, monospace", fontSize: 32, fontWeight: 500, color: "#0D0D0D", lineHeight: 1 }}>87</div>
                <div style={{ fontSize: 11, color: "#6B6560" }}>/ 100</div>
              </div>
            </div>
            <div style={{ height: 4, backgroundColor: "#F3F1EC", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "87%", backgroundColor: "#B8FF3C", borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" as const }}>
              {["Certification RGE", "Région Wallonie", "PME"].map(tag => (
                <span key={tag} style={{ backgroundColor: "#D4E8DF", color: "#16523A", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Mock match card 2 */}
          <div style={{ backgroundColor: "#F3F1EC", border: "1px solid #E2DDD6", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B6560", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: "Bricolage Grotesque, sans-serif", marginBottom: 4 }}>Match IA</div>
                <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 700, fontSize: 15, color: "#0D0D0D" }}>EnergiaTech SPRL</div>
                <div style={{ fontSize: 12, color: "#6B6560", marginTop: 2 }}>Greentech · Liège</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontFamily: "Fira Code, monospace", fontSize: 28, fontWeight: 500, color: "#3A3632", lineHeight: 1 }}>72</div>
                <div style={{ fontSize: 11, color: "#6B6560" }}>/ 100</div>
              </div>
            </div>
            <div style={{ height: 4, backgroundColor: "#EAE7E0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "72%", backgroundColor: "#B8FF3C", borderRadius: 2, opacity: 0.7 }} />
            </div>
          </div>

          {/* Label */}
          <div style={{ textAlign: "center" as const, fontSize: 12, color: "#B8B2AB" }}>
            Matching IA · Scores en temps réel
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div style={{ borderTop: "1px solid #E2DDD6", borderBottom: "1px solid #E2DDD6", backgroundColor: "#F3F1EC", overflow: "hidden", padding: "14px 0" }}>
        <div style={{ display: "flex", width: "max-content", animation: "ticker 25s linear infinite" }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 20, padding: "0 20px", whiteSpace: "nowrap" as const, fontSize: 13, fontWeight: 600, color: "#3A3632", fontFamily: "Bricolage Grotesque, sans-serif", letterSpacing: "0.02em" }}>
              {item}
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#B8FF3C", display: "inline-block", flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#16523A", fontFamily: "Bricolage Grotesque, sans-serif", marginBottom: 14 }}>Comment ça marche</div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, color: "#0D0D0D", letterSpacing: "-0.025em", maxWidth: 480, lineHeight: 1.1 }}>
            Opérationnel en 3 étapes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {steps.map((step, i) => (
            <div key={step.n} style={{ padding: "36px 32px", backgroundColor: i === 1 ? "#16523A" : "#F3F1EC", borderRadius: i === 0 ? "16px 0 0 16px" : i === 2 ? "0 16px 16px 0" : 0 }}>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 11, fontWeight: 500, color: i === 1 ? "rgba(184,255,60,0.8)" : "#B8B2AB", letterSpacing: "0.05em", marginBottom: 20 }}>{step.n}</div>
              <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 22, fontWeight: 700, color: i === 1 ? "#fff" : "#0D0D0D", marginBottom: 12, lineHeight: 1.2 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: i === 1 ? "rgba(255,255,255,0.65)" : "#6B6560", lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Actors ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#16523A", fontFamily: "Bricolage Grotesque, sans-serif", marginBottom: 14 }}>Les acteurs</div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, color: "#0D0D0D", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Une plateforme pour<br />tout l&apos;écosystème
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {actors.map((actor) => (
            <div key={actor.n} style={{ backgroundColor: "#F3F1EC", border: "1px solid #E2DDD6", borderRadius: 16, padding: "28px 24px", transition: "border-color 0.2s" }}>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 11, color: "#B8B2AB", marginBottom: 12 }}>{actor.n}</div>
              <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: 18, fontWeight: 700, color: "#0D0D0D", marginBottom: 8 }}>{actor.title}</h3>
              <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.65 }}>{actor.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: "#16523A", padding: "100px 24px", textAlign: "center" as const }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#B8FF3C", fontFamily: "Bricolage Grotesque, sans-serif", marginBottom: 20 }}>Rejoindre la plateforme</div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 20 }}>
            L&apos;énergie belge se<br />connecte ici.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 36 }}>
            Gratuit pour démarrer. Aucune carte de crédit requise.
          </p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "#B8FF3C", color: "#0D3324", fontWeight: 700, fontSize: 15, textDecoration: "none", padding: "14px 30px", borderRadius: 100, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #E2DDD6", padding: "28px 24px", backgroundColor: "#FAFAF7" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "#16523A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1 8h5.5L5 13l8-8H7.5L9 1z" fill="#B8FF3C"/>
              </svg>
            </div>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 800, fontSize: 14, color: "#0D0D0D" }}>EnergyHub</span>
            <span style={{ color: "#E2DDD6", margin: "0 8px" }}>|</span>
            <span style={{ fontSize: 13, color: "#B8B2AB" }}>Marketplace B2B · Belgique</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Annuaire", "/directory"], ["RFQ", "/rfq"], ["Investissement", "/investment"], ["Tarifs", "/pricing"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "#B8B2AB", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
