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
  industrial:      { label: "Industriel",           icon: "factory" },
  installer:       { label: "Installateur",          icon: "handyman" },
  software_editor: { label: "Éditeur logiciel",       icon: "code" },
  investor:        { label: "Investisseur",           icon: "trending_up" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "bolt" },
  esco:            { label: "ESCO / Consultant",      icon: "psychology" },
  greentech:       { label: "GreenTech",              icon: "eco" },
};

const ACTOR_TYPES = Object.entries(ACTOR_LABELS);

// Budget steps en milliers d'euros (index 5 = pas de limite)
const BUDGET_STEPS = [50, 100, 250, 500, 1000, Infinity];
const BUDGET_LABELS = ["50k€", "100k€", "250k€", "500k€", "1M€", "Tout"];

function parseBudgetMax(range: string | null): number {
  if (!range) return Infinity;
  const nums = range.replace(/\s/g, "").match(/[\d]+/g);
  if (!nums) return Infinity;
  return Math.max(...nums.map(Number));
}
const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];
const PUBLIC_LIMIT = 12;
const PAGE_SIZE = 20;

// ─── RFQCard ──────────────────────────────────────────────────────────────────

function RFQCard({ rfq }: { rfq: RFQ }) {
  const org = rfq.organizations;
  const orgType = org ? (ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "business" }) : null;

  const formattedDeadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const isRFI = rfq.type === "rfi";

  return (
    <div className="bg-white rounded-3xl p-6 border border-black/5 hover:border-black/20 hover:shadow-xl transition-all flex flex-col gap-4">
      {/* Header: type badge + org */}
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
          isRFI
            ? "bg-blue-50 text-blue-600 border-blue-200"
            : "bg-accent/20 text-primary border-accent/30"
        }`}>
          {rfq.type.toUpperCase()}
        </span>
        {org && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              {org.logo_url
                ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
                : <span className="material-symbols-outlined text-slate-400 text-sm">{orgType?.icon || "business"}</span>}
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 truncate block font-medium">
                {org.name}
                {org.is_verified && (
                  <span className="material-symbols-outlined text-green-500 text-xs ml-1 align-middle">verified</span>
                )}
              </span>
              {org.city && <span className="text-[10px] text-slate-400">{org.city}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Titre */}
      <h3 className="font-bold text-primary text-base leading-snug font-display">
        {rfq.title}
      </h3>

      {/* Description */}
      {rfq.description && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
          {rfq.description}
        </p>
      )}

      {/* Chips: budget · deadline · location */}
      <div className="flex flex-wrap gap-1.5">
        {rfq.budget_range && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">payments</span>
            {rfq.budget_range}
          </span>
        )}
        {formattedDeadline && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">calendar_today</span>
            {formattedDeadline}
          </span>
        )}
        {rfq.location && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {rfq.location}
          </span>
        )}
      </div>

      {/* Tags */}
      {rfq.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rfq.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] uppercase font-bold px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(22,82,58,0.07)", color: "#16523A" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/projets/${rfq.id}`}
        className="flex items-center justify-center gap-1.5 mt-auto px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50"
        style={{ borderColor: "#16523A", color: "#16523A" }}
      >
        <span className="material-symbols-outlined text-base">open_in_new</span>
        Voir le détail
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

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actorTypeFilter, setActorTypeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [budgetMax, setBudgetMax] = useState(5); // index dans BUDGET_STEPS
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

  useEffect(() => {
    const t = setTimeout(() => {
      fetchRFQs({ q: search, type: typeFilter, page: 0 });
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, typeFilter, fetchRFQs]);

  useEffect(() => {
    setPage(0);
  }, [actorTypeFilter, regionFilter, budgetMax, deadlineBefore, tagFilter]);

  const filtered = allRFQs.filter(rfq => {
    if (actorTypeFilter && !rfq.target_actor_types?.includes(actorTypeFilter)) return false;
    if (regionFilter && !rfq.location?.toLowerCase().includes(regionFilter.toLowerCase())) return false;
    const maxBudget = BUDGET_STEPS[budgetMax];
    if (maxBudget !== Infinity && parseBudgetMax(rfq.budget_range) > maxBudget * 1000) return false;
    if (deadlineBefore && rfq.deadline && new Date(rfq.deadline) > new Date(deadlineBefore)) return false;
    if (tagFilter && !rfq.tags?.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
    return true;
  });

  const visibleRFQs = isLoggedIn ? filtered : filtered.slice(0, PUBLIC_LIMIT);
  const hiddenCount = isLoggedIn ? 0 : Math.max(0, filtered.length - PUBLIC_LIMIT);
  const hasAnyFilter = search || typeFilter || actorTypeFilter || regionFilter || budgetMax < 5 || deadlineBefore || tagFilter;
  const hasClientFilter = !!(actorTypeFilter || regionFilter || budgetMax < 5 || deadlineBefore || tagFilter);

  return (
    <div className="flex gap-8 items-start">

      {/* ── Sidebar filtres ── */}
      <aside className="w-64 shrink-0 sticky top-8">
        <div className="bg-white rounded-3xl p-6 border border-black/5 space-y-6">

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Recherche</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">search</span>
              <input
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Titre, mot-clé..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Type</label>
            <div className="space-y-1.5 mt-2">
              {[["", "Tous"], ["rfq", "RFQ"], ["rfi", "RFI"]].map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="rfq-type" checked={typeFilter === val}
                    onChange={() => setTypeFilter(val)}
                    className="accent-primary" />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Acteur ciblé</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="actor-type" checked={actorTypeFilter === ""}
                  onChange={() => setActorTypeFilter("")}
                  className="accent-primary" />
                <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">Tous</span>
              </label>
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="actor-type" checked={actorTypeFilter === value}
                    onChange={() => setActorTypeFilter(value)}
                    className="accent-primary" />
                  <span className="flex items-center gap-1.5 text-sm text-slate-600 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xs">{icon}</span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Région</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="region" checked={regionFilter === ""}
                  onChange={() => setRegionFilter("")}
                  className="accent-primary" />
                <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">Toutes</span>
              </label>
              {REGIONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="region" checked={regionFilter === r}
                    onChange={() => setRegionFilter(r)}
                    className="accent-primary" />
                  <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Budget max</label>
              <span className="text-xs font-bold text-primary">{BUDGET_LABELS[budgetMax]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={budgetMax}
              onChange={e => setBudgetMax(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>50k€</span>
              <span>Tout</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Deadline avant le</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={deadlineBefore}
              onChange={e => setDeadlineBefore(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Tag</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              placeholder="ex: solaire, audit..."
            />
          </div>

          {hasAnyFilter && (
            <button
              onClick={() => {
                setSearch(""); setTypeFilter(""); setActorTypeFilter("");
                setRegionFilter(""); setBudgetMax(5); setDeadlineBefore(""); setTagFilter("");
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </aside>

      {/* ── Grille ── */}
      <div className="flex-1 min-w-0">

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-slate-500">
            {loading
              ? "Recherche..."
              : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
          </span>
          {isLoggedIn && (
            <Link
              href="/projets/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#16523A" }}
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Publier un RFQ
            </Link>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {visibleRFQs.map(rfq => (
            <RFQCard key={rfq.id} rfq={rfq} />
          ))}
        </div>

        {visibleRFQs.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">assignment</span>
            </div>
            <p className="text-primary font-bold font-display">Aucun appel d'offres trouvé</p>
          </div>
        )}

        {!isLoggedIn && hiddenCount > 0 && (
          <div className="mt-10 rounded-3xl p-10 text-center border" style={{ backgroundColor: "#fff", borderColor: "rgba(22,82,58,0.15)" }}>
            <span className="material-symbols-outlined text-5xl block mb-4" style={{ color: "#16523A" }}>lock</span>
            <p className="text-xl font-bold mb-2 font-display" style={{ color: "#16523A" }}>
              +{hiddenCount} appel{hiddenCount > 1 ? "s" : ""} d'offres disponible{hiddenCount > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Inscrivez-vous gratuitement pour accéder à tous les appels d'offres
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#16523A" }}
              >
                S'inscrire gratuitement
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-colors hover:bg-slate-50"
                style={{ borderColor: "#16523A", color: "#16523A" }}
              >
                Se connecter
              </Link>
            </div>
          </div>
        )}

        {isLoggedIn && !hasClientFilter && total > PAGE_SIZE && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              disabled={page === 0}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchRFQs({ q: search, type: typeFilter, page: p });
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50 disabled:opacity-30"
              style={{ borderColor: "#16523A", color: "#16523A" }}
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              Précédent
            </button>
            <span className="text-sm text-slate-500 px-4">
              Page {page + 1} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchRFQs({ q: search, type: typeFilter, page: p });
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50 disabled:opacity-30"
              style={{ borderColor: "#16523A", color: "#16523A" }}
            >
              Suivant
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
