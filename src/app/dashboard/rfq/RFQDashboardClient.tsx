"use client";

import { useState } from "react";
import Link from "next/link";
import RFQDashboardCard from "./RFQDashboardCard";

interface RFQ {
  id: string;
  title: string;
  type: string;
  description: string | null;
  budget_range: string | null;
  deadline: string | null;
  location: string | null;
  status: string;
  views_count: number;
  responses_count: number;
  ai_summary: string | null;
  ai_matched_at: string | null;
  published_at: string | null;
  created_at: string;
  tags: string[];
  target_actor_types: string[];
}

const TABS = [
  { id: "all",       label: "Tous" },
  { id: "published", label: "Publiés" },
  { id: "draft",     label: "Brouillons" },
  { id: "closed",    label: "Clôturés" },
] as const;

function matchesTab(rfq: RFQ, tab: string) {
  if (tab === "all") return true;
  if (tab === "published") return rfq.status === "published" || rfq.status === "responses_open" || rfq.status === "under_review";
  if (tab === "closed") return rfq.status === "closed" || rfq.status === "cancelled";
  return rfq.status === tab;
}

export default function RFQDashboardClient({ rfqs }: { rfqs: RFQ[] }) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = rfqs.filter(r => matchesTab(r, activeTab));

  const counts = {
    all: rfqs.length,
    published: rfqs.filter(r => matchesTab(r, "published")).length,
    draft: rfqs.filter(r => r.status === "draft").length,
    closed: rfqs.filter(r => matchesTab(r, "closed")).length,
  };

  return (
    <div>
      {/* Onglets */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map(tab => (
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

      {/* Grille */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rfq => (
            <RFQDashboardCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-4">📋</div>
          <p className="mb-4">
            {activeTab === "all"
              ? "Aucun appel d'offres pour le moment"
              : `Aucun RFQ dans l'onglet "${TABS.find(t => t.id === activeTab)?.label}"`}
          </p>
          {activeTab === "all" && (
            <Link href="/rfq/create" className="btn-primary text-sm">
              Publier mon premier RFQ →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
