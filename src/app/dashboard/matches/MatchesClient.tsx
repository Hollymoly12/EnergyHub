"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContactModal from "./ContactModal";

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
  industrial:      { label: "Industriel",           icon: "factory" },
  installer:       { label: "Installateur",          icon: "handyman" },
  software_editor: { label: "Éditeur logiciel",       icon: "code" },
  investor:        { label: "Investisseur",           icon: "trending_up" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "bolt" },
  esco:            { label: "ESCO / Consultant",      icon: "psychology" },
  greentech:       { label: "GreenTech",              icon: "eco" },
};

const TABS = [
  { id: "all",      label: "Tous" },
  { id: "received", label: "Reçus" },
  { id: "sent",     label: "Initiés" },
  { id: "unread",   label: "Non vus" },
] as const;

function scoreColor(score: number) {
  if (score >= 70) return "bg-accent/20 text-primary border-accent/30";
  if (score >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-red-100 text-red-600 border-red-200";
}

function MatchCard({ match, onContact }: { match: Match; onContact: (orgId: string, orgName: string) => void }) {
  const org = match.matched_org;
  const actorInfo = ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "business" };

  return (
    <div className={`bg-white rounded-3xl p-6 border flex flex-col gap-4 hover:shadow-xl transition-all ${!match.is_viewed ? "border-accent/40" : "border-black/5 hover:border-black/20"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
              : <span className="material-symbols-outlined text-slate-400 text-2xl">{actorInfo.icon}</span>}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-primary text-sm truncate font-display">
              {org.name}
              {org.is_verified && (
                <span className="material-symbols-outlined text-green-500 text-xs ml-1 align-middle">verified</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span className="material-symbols-outlined text-xs">{actorInfo.icon}</span>
              {actorInfo.label}
            </div>
            {org.city && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {org.city}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor(match.match_score)}`}>
            <span className="material-symbols-outlined text-xs">bolt</span>
            {match.match_score}%
          </span>
          {!match.is_viewed && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary">
              Nouveau
            </span>
          )}
        </div>
      </div>

      {/* Direction */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="material-symbols-outlined text-xs">
          {match.direction === "received" ? "call_received" : "call_made"}
        </span>
        {match.direction === "received" ? "Match reçu" : "Match initié"}
        {match.rfq_title && <span className="text-slate-400">· {match.rfq_title}</span>}
        {!match.rfq_id && <span className="text-slate-400">· Networking général</span>}
      </div>

      {/* Raisons */}
      {match.match_reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.match_reasons.slice(0, 3).map((reason, i) => (
            <span
              key={i}
              className="text-[10px] uppercase font-bold px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(22,82,58,0.07)", color: "#16523A" }}
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-auto pt-1">
        <Link
          href={`/directory/${org.slug}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#16523A", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">person</span>
          Profil
        </Link>
        <button
          onClick={() => onContact(org.id, org.name)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">mail</span>
          Contacter
        </button>
      </div>
    </div>
  );
}

export default function MatchesClient({ matches }: { matches: Match[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contactingOrg, setContactingOrg] = useState<{ id: string; name: string } | null>(null);
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
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors relative pb-3 ${
              activeTab === tab.id
                ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent"
                : "text-slate-500 hover:text-primary"
            }`}
          >
            {tab.label}
            {counts[tab.id as keyof typeof counts] > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-accent/20 text-primary" : "bg-slate-100 text-slate-500"
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
            <MatchCard key={match.id} match={match} onContact={(id, name) => setContactingOrg({ id, name })} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
          </div>
          <p className="text-primary font-bold text-lg font-display mb-2">
            {activeTab === "all" ? "Aucun match IA pour le moment" : "Aucun match dans cet onglet"}
          </p>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            {activeTab === "all"
              ? "Lancez le matching pour trouver vos meilleures correspondances parmi les acteurs de la plateforme."
              : "Essayez un autre onglet ou lancez le matching IA."}
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#16523A" }}
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            {isPending ? "Analyse en cours..." : "Lancer le matching IA"}
          </button>
        </div>
      )}

      {/* Bouton relancer si des matchs existent déjà */}
      {filtered.length > 0 && activeTab === "all" && (
        <div className="mt-8 flex flex-col items-center gap-2">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleRunMatching}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            {isPending ? "Analyse en cours..." : "Relancer le matching IA"}
          </button>
        </div>
      )}

      {contactingOrg && (
        <ContactModal
          targetOrgId={contactingOrg.id}
          targetOrgName={contactingOrg.name}
          onClose={() => setContactingOrg(null)}
        />
      )}
    </div>
  );
}
