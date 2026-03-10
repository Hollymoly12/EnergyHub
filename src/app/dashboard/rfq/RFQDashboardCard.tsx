"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateRFQStatus, deleteRFQ } from "./actions";

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:           { label: "Brouillon",       color: "text-slate-400 border-slate-600 bg-slate-800" },
  published:       { label: "Publié",           color: "text-green-400 border-green-400/30 bg-green-400/10" },
  responses_open:  { label: "Réponses ouvertes", color: "text-green-400 border-green-400/30 bg-green-400/10" },
  under_review:    { label: "En révision",      color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  closed:          { label: "Clôturé",          color: "text-slate-500 border-slate-700 bg-slate-800" },
  cancelled:       { label: "Annulé",           color: "text-red-400 border-red-400/30 bg-red-400/10" },
};

const ACTOR_LABELS: Record<string, string> = {
  industrial: "Industriel", installer: "Installateur",
  software_editor: "Éditeur logiciel", investor: "Investisseur",
  energy_provider: "Fournisseur d'énergie", esco: "ESCO", greentech: "GreenTech",
};

export default function RFQDashboardCard({ rfq }: { rfq: RFQ }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[rfq.status] || STATUS_CONFIG.draft;
  const isDraft = rfq.status === "draft";
  const isPublished = rfq.status === "published" || rfq.status === "responses_open";
  const isAIAnalyzed = !!rfq.ai_summary || !!rfq.ai_matched_at;

  const deadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })
    : null;

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      try { await updateRFQStatus(rfq.id, "published"); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleClose() {
    setError(null);
    startTransition(async () => {
      try { await updateRFQStatus(rfq.id, "closed"); }
      catch (e) { setError((e as Error).message); }
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setError(null);
    startTransition(async () => {
      try { await deleteRFQ(rfq.id); }
      catch (e) { setError((e as Error).message); setConfirmDelete(false); }
    });
  }

  return (
    <div className={`card p-5 flex flex-col gap-3 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header: type + statut */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
          {rfq.type.toUpperCase()}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-white text-sm leading-snug">{rfq.title}</h3>

      {/* Description */}
      {rfq.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{rfq.description}</p>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {rfq.budget_range && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            💰 {rfq.budget_range}
          </span>
        )}
        {deadline && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📅 {deadline}
          </span>
        )}
        {rfq.location && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📍 {rfq.location}
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
        <span>👁 {rfq.views_count} vues</span>
        <span>📬 {rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}</span>
        <span className={isAIAnalyzed ? "text-green-400" : "text-slate-600"}>
          🤖 {isAIAnalyzed ? "Analysé" : "En attente"}
        </span>
      </div>

      {/* Erreur */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link href={`/rfq/${rfq.id}`} className="btn-secondary text-xs py-2 w-full text-center">
          Voir le détail →
        </Link>
        {isDraft && (
          <button onClick={handlePublish} className="btn-primary text-xs py-2 w-full">
            Publier
          </button>
        )}
        {isPublished && (
          <button
            onClick={handleClose}
            className="text-xs py-2 w-full rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Clôturer
          </button>
        )}
        {isDraft && (
          <button
            onClick={handleDelete}
            className={`text-xs py-1.5 w-full transition-colors ${
              confirmDelete
                ? "text-red-400 hover:text-red-300 font-semibold"
                : "text-slate-600 hover:text-red-400"
            }`}
          >
            {confirmDelete ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        )}
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
