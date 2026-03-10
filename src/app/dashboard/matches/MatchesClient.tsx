"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MatchedOrg {
  id: string;
  name: string;
  slug: string;
  actor_type: string;
  logo_url: string | null;
  city: string | null;
  is_verified: boolean;
}

interface Match {
  id: string;
  match_score: number;
  match_reasons: string[];
  is_viewed: boolean;
  rfq_id: string | null;
  created_at: string;
  direction: "sent" | "received";
  matched_org: MatchedOrg;
  rfq_title?: string | null;
}

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

const TABS = [
  { id: "all",      label: "Tous" },
  { id: "received", label: "Reçus" },
  { id: "sent",     label: "Initiés" },
  { id: "unread",   label: "Non vus" },
] as const;

function scoreColor(score: number) {
  if (score >= 70) return "text-green-400 border-green-400/30 bg-green-400/10";
  if (score >= 40) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/10";
  return "text-red-400 border-red-400/30 bg-red-400/10";
}

function MatchCard({ match }: { match: Match }) {
  const org = match.matched_org;
  const actorInfo = ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" };

  return (
    <div className={`card p-5 flex flex-col gap-3 ${!match.is_viewed ? "border-yellow-500/20" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
              : actorInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-white text-sm truncate">
              {org.name}
              {org.is_verified && <span className="text-green-400 ml-1 text-xs">✓</span>}
            </div>
            <div className="text-[10px] text-slate-500">{actorInfo.icon} {actorInfo.label}</div>
            {org.city && <div className="text-[10px] text-slate-600">📍 {org.city}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor(match.match_score)}`}>
            {match.match_score}%
          </span>
          {!match.is_viewed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
              Nouveau
            </span>
          )}
        </div>
      </div>

      {/* Direction */}
      <div className="text-[10px] text-slate-600">
        {match.direction === "received" ? "↙ Match reçu" : "↗ Match initié"}
        {match.rfq_title && <span className="ml-2 text-slate-500">· RFQ : {match.rfq_title}</span>}
        {!match.rfq_id && <span className="ml-2">· Networking général</span>}
      </div>

      {/* Raisons */}
      {match.match_reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.match_reasons.slice(0, 3).map((reason, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/directory/${org.slug}`}
          className="btn-secondary text-xs py-2 flex-1 text-center"
        >
          Voir le profil →
        </Link>
        <Link
          href="/dashboard/messages"
          className="btn-primary text-xs py-2 flex-1 text-center"
        >
          Contacter
        </Link>
      </div>
    </div>
  );
}

export default function MatchesClient({ matches }: { matches: Match[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = matches.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !m.is_viewed;
    return m.direction === activeTab;
  });

  const counts = {
    all: matches.length,
    received: matches.filter((m) => m.direction === "received").length,
    sent: matches.filter((m) => m.direction === "sent").length,
    unread: matches.filter((m) => !m.is_viewed).length,
  };

  function handleRunMatching() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents/matching", { method: "POST" });
        if (!res.ok) throw new Error("Erreur lors du matching");
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative pb-3 ${
              activeTab === tab.id
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-yellow-500"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
            {counts[tab.id as keyof typeof counts] > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-yellow-500/20 text-yellow-500" : "bg-slate-800 text-slate-500"
              }`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grille ou état vide */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-4">🧠</div>
          <p className="text-white font-semibold mb-2">
            {activeTab === "all" ? "Aucun match IA pour le moment" : `Aucun match dans cet onglet`}
          </p>
          <p className="text-slate-500 text-sm mb-6">
            {activeTab === "all"
              ? "Lancez le matching pour trouver vos meilleures correspondances parmi les acteurs de la plateforme."
              : "Essayez un autre onglet ou lancez le matching IA."}
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {isPending ? "Analyse en cours..." : "🤖 Lancer le matching IA"}
          </button>
        </div>
      )}

      {/* Bouton relancer si des matchs existent déjà */}
      {filtered.length > 0 && activeTab === "all" && (
        <div className="mt-8 flex flex-col items-center gap-2">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            {isPending ? "Analyse en cours..." : "↺ Relancer le matching IA"}
          </button>
        </div>
      )}
    </div>
  );
}
