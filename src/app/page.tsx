import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ background: "#080C14", minHeight: "100vh", color: "#E2E8F0" }}>

      {/* ── NAVBAR ── */}
      <header className="border-b border-slate-800 sticky top-0 z-50" style={{ background: "#080C14" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-sm font-bold text-black">⚡</div>
            <span className="font-bold text-white text-sm tracking-tight">EnergyHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/directory" className="text-sm text-slate-400 hover:text-white transition-colors">Annuaire</Link>
            <Link href="/rfq" className="text-sm text-slate-400 hover:text-white transition-colors">RFQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Se connecter</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">S'inscrire</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/8 text-yellow-400 text-xs font-semibold tracking-wide mb-8">
          ⚡ Marketplace B2B · Belgique
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-3xl mx-auto">
          Connectez-vous aux acteurs de la{" "}
          <span className="text-yellow-500">transition énergétique</span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          EnergyHub réunit industriels, installateurs et greentechs sur une seule plateforme —
          avec matching IA et RFQ intégrés.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            S'inscrire gratuitement →
          </Link>
          <Link href="/directory" className="btn-secondary px-8 py-3 text-base">
            Parcourir l'annuaire
          </Link>
        </div>
      </section>

      {/* ── PROBLÈME ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800">
        <div className="text-center mb-12">
          <div className="section-tag mb-3">Le problème</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Un marché de l'énergie encore trop fragmenté
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🗺️",
              title: "Un marché illisible",
              desc: "Des centaines d'acteurs répartis sur 3 régions. Impossible de trouver rapidement le bon partenaire technique ou commercial.",
            },
            {
              icon: "⏳",
              title: "Des appels d'offres inefficaces",
              desc: "Des mois de prospection manuelle pour trouver le bon installateur ou éditeur logiciel. Temps et budget gaspillés.",
            },
            {
              icon: "🚪",
              title: "Des opportunités manquées",
              desc: "Les greentechs et startups peinent à accéder aux grands comptes industriels et aux investisseurs belges.",
            },
          ].map((p) => (
            <div key={p.title} className="card p-6">
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800">
        <div className="text-center mb-12">
          <div className="section-tag mb-3">Comment ça marche</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            3 étapes pour trouver vos partenaires
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Créez votre profil",
              desc: "Renseignez votre type d'acteur, vos expertises, certifications et technologies. Notre IA analyse votre profil.",
            },
            {
              step: "02",
              title: "Publiez ou répondez à un RFQ",
              desc: "Lancez un appel d'offres ciblé ou répondez à ceux qui correspondent à votre expertise.",
            },
            {
              step: "03",
              title: "Recevez vos matchs IA",
              desc: "EnergyHub calcule automatiquement les meilleures correspondances et vous met en relation.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="text-3xl font-bold text-yellow-500/20 font-mono leading-none shrink-0">{s.step}</div>
              <div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POUR VOUS ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800">
        <div className="text-center mb-12">
          <div className="section-tag mb-3">Pour vous</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Conçu pour chaque acteur de l'énergie
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Industriels */}
          <div className="card p-6 border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
            <div className="text-3xl mb-4">⚡</div>
            <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Industriels</div>
            <h3 className="font-semibold text-white mb-2">
              Trouvez les bons prestataires, vite
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Publiez vos appels d'offres et recevez des propositions qualifiées en quelques jours.
            </p>
            <ul className="space-y-2 mb-6">
              {["Matching IA sur vos RFQ", "RFQ illimités (plan Pro)", "Annuaire de 100+ fournisseurs certifiés"].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-yellow-500 shrink-0 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/register?type=industrial" className="btn-primary text-xs py-2 w-full block text-center">
              Publier un RFQ →
            </Link>
          </div>

          {/* Installateurs */}
          <div className="card p-6 border-slate-700 hover:border-slate-600 transition-colors">
            <div className="text-3xl mb-4">🔧</div>
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Installateurs</div>
            <h3 className="font-semibold text-white mb-2">
              Développez votre carnet de commandes
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Accédez aux appels d'offres qualifiés qui correspondent à votre expertise technique.
            </p>
            <ul className="space-y-2 mb-6">
              {["Alertes RFQ ciblées par région", "Profil certifié visible par tous", "Messagerie intégrée"].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-green-400 shrink-0 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/register?type=installer" className="btn-secondary text-xs py-2 w-full block text-center">
              Créer mon profil →
            </Link>
          </div>

          {/* Greentechs */}
          <div className="card p-6 border-green-400/20 hover:border-green-400/40 transition-colors">
            <div className="text-3xl mb-4">🌱</div>
            <div className="text-xs font-bold tracking-widest text-green-400 uppercase mb-2">Greentechs</div>
            <h3 className="font-semibold text-white mb-2">
              Accédez aux grands comptes et aux investisseurs
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Gagnez en visibilité B2B et connectez-vous aux fonds d'investissement belges.
            </p>
            <ul className="space-y-2 mb-6">
              {["Accès au module investissement", "Deal flow avec fonds belges", "Visibilité premium B2B"].map(f => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-green-400 shrink-0 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/register?type=greentech" className="btn-secondary text-xs py-2 w-full block text-center">
              Rejoindre EnergyHub →
            </Link>
          </div>

        </div>
      </section>

      {/* ── CHIFFRES ── */}
      <section className="border-t border-slate-800" style={{ background: "#0D1520" }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "7",       label: "Types d'acteurs",     sub: "connectés sur la plateforme" },
              { value: "IA",      label: "Matching intelligent", sub: "en temps réel" },
              { value: "3",       label: "Régions belges",       sub: "Wallonie · Flandre · BXL" },
              { value: "Gratuit", label: "Pour démarrer",        sub: "Sans CB requise" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-yellow-500 mb-1">{s.value}</div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center border-t border-slate-800">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Rejoignez la marketplace de la<br />
          <span className="text-yellow-500">transition énergétique belge</span>
        </h2>
        <p className="text-slate-400 mb-8 text-sm">
          Inscription gratuite · Aucune CB requise · Déployé en Belgique
        </p>
        <Link href="/register" className="btn-primary px-10 py-3 text-base inline-block">
          S'inscrire gratuitement →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-[10px] font-bold text-black">⚡</div>
            <span className="text-sm text-slate-500">EnergyHub · Belgique</span>
          </div>
          <div className="flex gap-6">
            <Link href="/directory" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Annuaire</Link>
            <Link href="/rfq" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">RFQ</Link>
            <Link href="/pricing" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Tarifs</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
