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
  draft:           { label: "Brouillon",       color: "text-slate-500 border-slate-200 bg-slate-100" },
  published:       { label: "Publié",           color: "text-green-600 border-green-200 bg-green-50" },
  responses_open:  { label: "Réponses ouvertes", color: "text-green-600 border-green-200 bg-green-50" },
  under_review:    { label: "En révision",      color: "bg-accent/20 text-primary border-accent/30" },
  closed:          { label: "Clôturé",          color: "text-slate-400 border-slate-200 bg-slate-100" },
  cancelled:       { label: "Annulé",           color: "text-red-500 border-red-200 bg-red-50" },
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
    <div className={`bg-white rounded-3xl p-5 border border-black/5 flex flex-col gap-3 hover:shadow-lg transition-all ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header: type + statut */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-accent/20 text-primary border-accent/30">
          {rfq.type.toUpperCase()}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Titre */}
      <h3 className="font-bold text-primary text-sm leading-snug font-display">{rfq.title}</h3>

      {/* Description */}
      {rfq.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{rfq.description}</p>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {rfq.budget_range && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">payments</span>
            {rfq.budget_range}
          </span>
        )}
        {deadline && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">calendar_today</span>
            {deadline}
          </span>
        )}
        {rfq.location && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {rfq.location}
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">visibility</span>
          {rfq.views_count} vues
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">mail</span>
          {rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}
        </span>
        <span className={`flex items-center gap-1 ${isAIAnalyzed ? "text-primary" : "text-slate-300"}`}>
          <span className="material-symbols-outlined text-xs">auto_awesome</span>
          {isAIAnalyzed ? "Analysé" : "En attente"}
        </span>
      </div>

      {/* Erreur */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link
          href={`/rfq/${rfq.id}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#16523A", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          Voir le détail
        </Link>
        {isDraft && (
          <button
            onClick={handlePublish}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16523A" }}
          >
            <span className="material-symbols-outlined text-sm">publish</span>
            Publier
          </button>
        )}
        {isPublished && (
          <button
            onClick={handleClose}
            className="text-xs py-2.5 w-full rounded-xl border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors"
          >
            Clôturer
          </button>
        )}
        {isDraft && (
          <button
            onClick={handleDelete}
            className={`text-xs py-1.5 w-full transition-colors ${
              confirmDelete
                ? "text-red-500 hover:text-red-600 font-semibold"
                : "text-slate-400 hover:text-red-500"
            }`}
          >
            {confirmDelete ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        )}
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
