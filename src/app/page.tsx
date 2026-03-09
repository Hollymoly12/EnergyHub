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

    </div>
  );
}
