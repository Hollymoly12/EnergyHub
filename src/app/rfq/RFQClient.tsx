"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  actor_type: string;
  city: string | null;
  is_verified: boolean;
  subscription_plan: string;
}

interface RFQ {
  id: string;
  title: string;
  type: string;
  description: string | null;
  budget_range: string | null;
  deadline: string | null;
  location: string | null;
  target_actor_types: string[];
  tags: string[];
  published_at: string | null;
  organizations: Organization | null;
}

interface Props {
  initialRFQs: RFQ[];
  totalCount: number;
  isLoggedIn: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

const ACTOR_TYPES = Object.entries(ACTOR_LABELS);
const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];
const PUBLIC_LIMIT = 12;
const PAGE_SIZE = 20;

// ─── RFQCard ──────────────────────────────────────────────────────────────────

function RFQCard({ rfq }: { rfq: RFQ }) {
  const org = rfq.organizations;
  const orgType = org ? (ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" }) : null;

  const formattedDeadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const isRFI = rfq.type === "rfi";

  return (
    <div className="card p-5">
      {/* Header: type badge + org */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
          isRFI
            ? "text-blue-400 border-blue-400/30 bg-blue-400/8"
            : "text-yellow-500 border-yellow-500/30 bg-yellow-500/8"
        }`}>
          {rfq.type.toUpperCase()}
        </span>
        {org && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {org.logo_url
                ? <img src={org.logo_url} alt="" className="w-full h-full object-contain" />
                : orgType?.icon || "🏢"}
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 truncate block">
                {org.name}
                {org.is_verified && <span className="text-green-400 ml-1">✓</span>}
              </span>
              {org.city && <span className="text-[10px] text-slate-600">{org.city}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Titre */}
      <h3 className="font-semibold text-white text-sm mb-2 leading-snug">
        {rfq.title}
      </h3>

      {/* Description */}
      {rfq.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-5">
          {rfq.description}
        </p>
      )}

      {/* Chips: budget · deadline · location */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {rfq.budget_range && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            💰 {rfq.budget_range}
          </span>
        )}
        {formattedDeadline && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📅 {formattedDeadline}
          </span>
        )}
        {rfq.location && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            📍 {rfq.location}
          </span>
        )}
      </div>

      {/* Tags */}
      {rfq.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {rfq.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/rfq/${rfq.id}`}
        className="btn-secondary text-xs py-2 w-full block text-center"
      >
        Voir le détail →
      </Link>
    </div>
  );
}

// ─── RFQClient ────────────────────────────────────────────────────────────────

export default function RFQClient({ initialRFQs, totalCount, isLoggedIn }: Props) {
  const [allRFQs, setAllRFQs] = useState<RFQ[]>(initialRFQs);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  // Filtres API
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Filtres client
  const [actorTypeFilter, setActorTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [deadlineBefore, setDeadlineBefore] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const fetchRFQs = useCallback(async (params: {
    q?: string; type?: string; page?: number;
  }) => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.type) sp.set("type", params.type);
    sp.set("limit", String(PAGE_SIZE));
    sp.set("page", String(params.page || 0));

    try {
      const res = await fetch(`/api/rfq?${sp}`);
      const data = res.ok ? await res.json() : { rfqs: [], total: 0 };
      setAllRFQs(data.rfqs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce sur search + type
  useEffect(() => {
    const t = setTimeout(() => {
      fetchRFQs({ q: search, type: typeFilter, page: 0 });
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, typeFilter, fetchRFQs]);

  // Filtres client appliqués après fetch
  const filtered = allRFQs.filter(rfq => {
    if (actorTypeFilter && !rfq.target_actor_types?.includes(actorTypeFilter)) return false;
    if (regionFilter && !rfq.location?.toLowerCase().includes(regionFilter.toLowerCase())) return false;
    if (budgetFilter && !rfq.budget_range?.toLowerCase().includes(budgetFilter.toLowerCase())) return false;
    if (deadlineBefore && rfq.deadline && new Date(rfq.deadline) > new Date(deadlineBefore)) return false;
    if (tagFilter && !rfq.tags?.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
    return true;
  });

  const visibleRFQs = isLoggedIn ? filtered : filtered.slice(0, PUBLIC_LIMIT);
  const hiddenCount = isLoggedIn ? 0 : Math.max(0, total - PUBLIC_LIMIT);

  const hasAnyFilter = search || typeFilter || actorTypeFilter || regionFilter || budgetFilter || deadlineBefore || tagFilter;

  return (
    <div className="flex gap-6 items-start">

      {/* ── Sidebar filtres ── */}
      <aside className="w-64 shrink-0 sticky top-8">
        <div className="card p-5 space-y-6">

          {/* Recherche */}
          <div>
            <label className="label">Recherche</label>
            <input
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Titre, mot-clé..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="label">Type</label>
            <div className="space-y-1.5 mt-2">
              {[["", "Tous"], ["rfq", "RFQ"], ["rfi", "RFI"]].map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="rfq-type" checked={typeFilter === val}
                    onChange={() => setTypeFilter(val)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Acteur ciblé */}
          <div>
            <label className="label">Acteur ciblé</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="actor-type" checked={actorTypeFilter === ""}
                  onChange={() => setActorTypeFilter("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Tous</span>
              </label>
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="actor-type" checked={actorTypeFilter === value}
                    onChange={() => setActorTypeFilter(value)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Région */}
          <div>
            <label className="label">Région</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="region" checked={regionFilter === ""}
                  onChange={() => setRegionFilter("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Toutes</span>
              </label>
              {REGIONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="region" checked={regionFilter === r}
                    onChange={() => setRegionFilter(r)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label">Budget (contient)</label>
            <input
              className="input"
              value={budgetFilter}
              onChange={e => setBudgetFilter(e.target.value)}
              placeholder="ex: 50k, €, 100 000..."
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="label">Deadline avant le</label>
            <input
              type="date"
              className="input"
              value={deadlineBefore}
              onChange={e => setDeadlineBefore(e.target.value)}
            />
          </div>

          {/* Tag */}
          <div>
            <label className="label">Tag</label>
            <input
              className="input"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              placeholder="ex: solaire, audit..."
            />
          </div>

          {hasAnyFilter && (
            <button
              onClick={() => {
                setSearch(""); setTypeFilter(""); setActorTypeFilter("");
                setRegionFilter(""); setBudgetFilter(""); setDeadlineBefore(""); setTagFilter("");
              }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              ↺ Réinitialiser les filtres
            </button>
          )}
        </div>
      </aside>

      {/* ── Grille ── */}
      <div className="flex-1 min-w-0">

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            {loading
              ? "Recherche..."
              : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
          </span>
          {isLoggedIn && (
            <Link href="/rfq/create" className="btn-primary text-xs py-2 px-4">
              + Publier un RFQ
            </Link>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {visibleRFQs.map(rfq => (
            <RFQCard key={rfq.id} rfq={rfq} />
          ))}
        </div>

        {visibleRFQs.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-3">📋</div>
            <p>Aucun appel d'offres trouvé</p>
          </div>
        )}

        {!isLoggedIn && hiddenCount > 0 && (
          <div className="mt-6 card p-8 text-center border-yellow-500/20">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-white font-semibold mb-1">
              +{hiddenCount} appel{hiddenCount > 1 ? "s" : ""} d'offres disponible{hiddenCount > 1 ? "s" : ""}
            </div>
            <div className="text-slate-500 text-sm mb-4">
              Inscrivez-vous gratuitement pour accéder à tous les appels d'offres
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/register" className="btn-primary">S'inscrire gratuitement →</a>
              <a href="/login" className="btn-secondary">Se connecter</a>
            </div>
          </div>
        )}

        {isLoggedIn && total > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={page === 0}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchRFQs({ q: search, type: typeFilter, page: p });
              }}
              className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-500 flex items-center px-4">
              Page {page + 1} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchRFQs({ q: search, type: typeFilter, page: p });
              }}
              className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
