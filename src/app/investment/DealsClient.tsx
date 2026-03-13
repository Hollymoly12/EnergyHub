// src/app/investment/DealsClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  description: string;
  project_type: string | null;
  funding_amount: number | null;
  funding_type: string | null;
  irr_target: number | null;
  published_at: string | null;
  interests_count: number;
  organizations: { name: string; city: string | null } | null;
}

interface Props {
  deals: Deal[];
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  solar: "Solaire",
  wind: "Éolien",
  storage: "Stockage",
  efficiency: "Efficacité énergétique",
  other: "Autre",
};

const FUNDING_TYPE_LABELS: Record<string, string> = {
  equity: "Equity",
  debt: "Dette",
  convertible: "Convertible",
  grant: "Subvention",
};

export default function DealsClient({ deals }: Props) {
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
  const [fundingTypeFilter, setFundingTypeFilter] = useState<string>("all");

  const filtered = deals.filter((d) => {
    if (projectTypeFilter !== "all" && d.project_type !== projectTypeFilter) return false;
    if (fundingTypeFilter !== "all" && d.funding_type !== fundingTypeFilter) return false;
    return true;
  });

  function formatAmount(amount: number | null): string {
    if (!amount) return "Montant non précisé";
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
    return `${amount.toLocaleString("fr-FR")} €`;
  }

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={projectTypeFilter}
          onChange={(e) => setProjectTypeFilter(e.target.value)}
          className="input text-sm"
        >
          <option value="all">Tous les types de projet</option>
          {Object.entries(PROJECT_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={fundingTypeFilter}
          onChange={(e) => setFundingTypeFilter(e.target.value)}
          className="input text-sm"
        >
          <option value="all">Tous les financements</option>
          {Object.entries(FUNDING_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-slate-500 text-sm self-center">
          {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg mb-2">Aucun deal ne correspond aux filtres.</p>
          <p className="text-sm">Essayez d&apos;élargir vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((deal) => (
            <div key={deal.id} className="card p-6 flex flex-col">
              {/* Type badge */}
              {deal.project_type && (
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3">
                  {PROJECT_TYPE_LABELS[deal.project_type] || deal.project_type}
                </span>
              )}
              <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">{deal.title}</h3>
              <p className="text-slate-400 text-sm mb-1">
                {deal.organizations?.name}
                {deal.organizations?.city ? ` · ${deal.organizations.city}` : ""}
              </p>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{deal.description}</p>

              <div className="flex flex-wrap gap-3 text-sm mb-4 mt-auto">
                <span className="text-green-400 font-medium">{formatAmount(deal.funding_amount)}</span>
                {deal.funding_type && (
                  <span className="text-slate-400">{FUNDING_TYPE_LABELS[deal.funding_type] || deal.funding_type}</span>
                )}
                {deal.irr_target && (
                  <span className="text-slate-400">IRR {deal.irr_target}%</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-xs">{deal.interests_count} intérêt{deal.interests_count !== 1 ? "s" : ""}</span>
                <Link href={`/investment/${deal.id}`} className="btn-primary text-sm px-4 py-2">
                  Voir le deal →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
