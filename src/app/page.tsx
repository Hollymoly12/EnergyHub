import Link from "next/link";

export default function LandingPage() {
  const tickerItems = [
    "Installateurs",
    "Industriels",
    "Greentechs",
    "Investisseurs",
    "Fournisseurs d'énergie",
    "Éditeurs SaaS",
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7", color: "#0D0D0D" }}>

      {/* ── Sticky Navbar ── */}
      <nav className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-accent" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <span className="font-display font-extrabold text-xl text-primary tracking-tight">EnergyHub</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              ["Marketplace", "/directory"],
              ["Annuaire", "/directory"],
              ["Projets", "/rfq"],
              ["Investissements", "/investment"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-semibold text-slate-600 hover:text-primary px-4 py-2 rounded-full hover:bg-primary/5 transition-colors no-underline"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="rounded-full p-2 hover:bg-primary/5 transition-colors text-slate-500">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
            </button>
            <Link
              href="/login"
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity no-underline"
            >
              Mon Compte
            </Link>
            <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 18 }}>person</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left column */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-8">
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-sm font-semibold">Plateforme IA B2B · Belgique</span>
            </div>

            {/* H1 */}
            <h1 className="font-display font-extrabold text-5xl lg:text-7xl text-primary leading-tight tracking-tight mb-6">
              La marketplace<br />
              de la transition<br />
              énergétique belge
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed mb-10">
              Connectez industriels, installateurs, investisseurs et greentechs. Matching IA 0-100, RFQ automatisés, module d&apos;investissement intégré.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/register"
                className="bg-accent text-primary px-8 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity no-underline inline-flex items-center gap-2"
              >
                Créer un compte gratuit
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
              <Link
                href="/directory"
                className="border-2 border-slate-200 text-primary px-8 py-4 rounded-2xl font-semibold text-base hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline inline-flex items-center gap-2"
              >
                Voir l&apos;annuaire
              </Link>
            </div>

            {/* Avatar row + social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-rose-500"].map((color, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full ${color} border-2 border-white flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                ))}
              </div>
              <div>
                <span className="text-sm font-semibold text-primary">1 200+ entreprises connectées</span>
              </div>
            </div>
          </div>

          {/* Right column: Match card UI */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 w-full max-w-sm">
              {/* Card header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>factory</span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-primary text-base">SolarNRG Belgium</div>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Installateur</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Bruxelles</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI match badge */}
              <div className="flex items-center gap-2 bg-accent/10 text-primary rounded-full px-4 py-2 mb-5 w-fit">
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-sm font-bold">98% Match IA</span>
              </div>

              {/* Score bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">Score de compatibilité</span>
                  <span className="font-display font-extrabold text-primary text-2xl">98/100</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: "98%" }} />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {["Certification RGE", "Wallonie", "Panneaux solaires"].map((tag) => (
                  <span key={tag} className="text-xs bg-primary/5 text-primary px-3 py-1 rounded-full font-semibold">
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/directory"
                className="w-full bg-primary text-white text-sm font-bold py-3 rounded-2xl text-center hover:opacity-90 transition-opacity no-underline flex items-center justify-center gap-2"
              >
                Voir le profil
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>

              {/* Second card preview */}
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>eco</span>
                    </div>
                    <div>
                      <div className="font-semibold text-primary text-sm">EnergiaTech SPRL</div>
                      <div className="text-xs text-slate-400">Greentech · Liège</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 text-primary rounded-full px-3 py-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="text-xs font-bold">72%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Trust Ticker Bar ── */}
      <div className="bg-primary overflow-hidden py-4">
        <div className="flex" style={{ width: "max-content", animation: "ticker 28s linear infinite" }}>
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 px-6 text-white/70 uppercase text-sm font-semibold tracking-wider whitespace-nowrap"
            >
              {item}
              <span className="material-symbols-outlined text-white/30" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>fiber_manual_record</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Value Proposition ── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-5">
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span className="text-xs font-bold uppercase tracking-wider">Matching Intelligent</span>
            </div>
            <h2 className="font-display font-extrabold text-4xl text-primary tracking-tight max-w-lg leading-tight">
              Trouvez le partenaire idéal
            </h2>
          </div>

          {/* 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-3xl border border-primary/5 hover:border-primary/20 p-8 transition-colors bg-slate-50">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <h3 className="font-display font-bold text-xl text-primary mb-3">Matching IA 0-100</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Notre algorithme calcule un score de compatibilité entre chaque acteur. Fini les cold emails — seuls les bons profils remontent.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl border border-primary/5 hover:border-primary/20 p-8 transition-colors bg-slate-50">
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>assignment</span>
              </div>
              <h3 className="font-display font-bold text-xl text-primary mb-3">RFQ Automatisés</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Publiez un appel d&apos;offres en 2 minutes. L&apos;IA analyse les réponses, les note et vous présente un classement objectif.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl border border-primary/5 hover:border-primary/20 p-8 transition-colors bg-slate-50">
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <h3 className="font-display font-bold text-xl text-primary mb-3">Module Investissement</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Déposez vos deals, gérez les NDA et intéressez les fonds qualifiés. Un pipeline structuré du sourcing à la clôture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-primary py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent/80 rounded-full px-4 py-1.5 mb-5">
              <span className="material-symbols-outlined text-accent/80" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>route</span>
              <span className="text-xs font-bold uppercase tracking-wider text-accent/80">Processus</span>
            </div>
            <h2 className="font-display font-extrabold text-4xl text-white tracking-tight leading-tight">
              Comment ça marche
            </h2>
          </div>

          {/* 3 steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                icon: "person_add",
                title: "Créez votre profil",
                desc: "L'agent IA analyse votre organisation et optimise votre visibilité sur la plateforme en quelques minutes.",
              },
              {
                num: "2",
                icon: "description",
                title: "Publiez ou répondez",
                desc: "Créez des RFQ ciblés ou répondez aux appels d'offres correspondant exactement à vos compétences.",
              },
              {
                num: "3",
                icon: "handshake",
                title: "Matching & connexion",
                desc: "L'algorithme calcule un score 0-100 et vous met en relation avec les meilleurs partenaires de l'écosystème.",
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                {/* Ghost number */}
                <div
                  className="font-display font-black text-white/5 leading-none select-none mb-2"
                  style={{ fontSize: 120 }}
                >
                  {step.num}
                </div>
                <div className="-mt-16 relative z-10">
                  <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                  </div>
                  <h3 className="font-display font-bold text-white text-xl mb-3">{step.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <div className="px-6 mb-12 pt-12" style={{ backgroundColor: "#FAFAF7" }}>
        <div
          className="bg-accent rounded-[3rem] mx-auto max-w-6xl py-20 px-8 text-center relative overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(22,82,58,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div className="relative z-10">
            <h2 className="font-display font-extrabold text-primary text-4xl lg:text-5xl leading-tight tracking-tight mb-4">
              L&apos;énergie belge<br />se connecte ici
            </h2>
            <p className="text-primary/70 text-lg font-medium mb-10">
              Gratuit pour démarrer · Aucune carte de crédit requise
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity no-underline"
            >
              Créer un compte gratuit
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
            {/* Logo + description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-accent" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <span className="font-display font-extrabold text-xl text-white tracking-tight">EnergyHub</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                La marketplace B2B de la transition énergétique belge. Connectez-vous avec les bons partenaires grâce à l&apos;IA.
              </p>
            </div>

            {/* Nav col 1 */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">Plateforme</div>
              <ul className="space-y-3">
                {[["Annuaire", "/directory"], ["Appels d'offres", "/rfq"], ["Investissement", "/investment"], ["Tarifs", "/pricing"]].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-white/60 text-sm hover:text-white transition-colors no-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nav col 2 */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">Acteurs</div>
              <ul className="space-y-3">
                {["Industriels", "Installateurs", "Greentechs", "Investisseurs", "Fournisseurs d'énergie"].map((label) => (
                  <li key={label}>
                    <Link href="/directory" className="text-white/60 text-sm hover:text-white transition-colors no-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal col */}
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">Légal</div>
              <ul className="space-y-3">
                {[["Mentions légales", "#"], ["Politique de confidentialité", "#"], ["CGU", "#"], ["RGPD", "#"]].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-white/60 text-sm hover:text-white transition-colors no-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © 2026 EnergyHub. Tous droits réservés. Belgique.
            </p>
            <p className="text-white/20 text-xs">
              Transition énergétique · IA · B2B
            </p>
          </div>
        </div>
      </footer>

      {/* Ticker animation */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>

    </div>
  );
}
