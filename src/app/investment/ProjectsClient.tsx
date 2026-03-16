"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  project_type: string | null;
  funding_amount: number | null;
  funding_type: string | null;
  irr_target: number | null;
  published_at: string | null;
  interests_count: number | null;
  ai_risk_score: number | null;
  status: string | null;
  capacity_mw: number | null;
  location: string | null;
  series: string | null;
  organizations: { name: string; city: string | null } | null;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  solar:      { label: "Solaire",    icon: "wb_sunny",                  color: "bg-amber-400/90" },
  wind:       { label: "Éolien",     icon: "air",                       color: "bg-sky-400/90" },
  storage:    { label: "Stockage",   icon: "battery_charging_full",     color: "bg-violet-400/90" },
  hydrogen:   { label: "Hydrogène",  icon: "science",                   color: "bg-teal-400/90" },
  efficiency: { label: "Efficacité", icon: "precision_manufacturing",   color: "bg-orange-400/90" },
  other:      { label: "Autre",      icon: "bolt",                      color: "bg-slate-400/90" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  construction: { label: "Construction",  dot: "bg-amber-500" },
  planning:     { label: "Planification", dot: "bg-blue-500" },
  operational:  { label: "Opérationnel",  dot: "bg-green-500" },
  published:    { label: "Publié",        dot: "bg-green-500" },
  closed:       { label: "Clôturé",       dot: "bg-red-400" },
};

const GRADIENT_BY_TYPE: Record<string, string> = {
  solar:      "from-amber-200 via-orange-200 to-yellow-100",
  wind:       "from-sky-200 via-blue-100 to-slate-100",
  storage:    "from-slate-200 via-gray-100 to-slate-50",
  hydrogen:   "from-teal-200 via-cyan-100 to-blue-50",
  efficiency: "from-orange-100 via-amber-50 to-yellow-50",
  other:      "from-slate-100 to-slate-200",
};

const REGIONS = ["Wallonie", "Flandre", "Bruxelles"];
const SORT_OPTIONS = [
  { value: "recent",   label: "Plus récents" },
  { value: "score",    label: "Score IA" },
  { value: "funding",  label: "Montant" },
];
const PAGE_SIZE = 6;

function formatAmount(amount: number | null): string {
  if (!amount) return "N/A";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
  return `${amount.toLocaleString("fr-FR")} €`;
}

// ai_risk_score: 0=low risk, 100=high risk
// Grade A+ = risk ≤ 20, B = 21-40, C = 41+
const FUNDING_TYPES = ["equity", "debt", "convertible"];
const FUNDING_TYPE_LABELS: Record<string, string> = {
  equity: "Equity", debt: "Dette", convertible: "Convertible",
};

export default function ProjectsClient({ deals }: { deals: Deal[] }) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedFundingType, setSelectedFundingType] = useState("");
  const [maxRiskScore, setMaxRiskScore] = useState(100);
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);

  const toggleType = (type: string) =>
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  const toggleRegion = (r: string) =>
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );

  const filtered = useMemo(() => {
    let list = [...deals];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.organizations?.city?.toLowerCase().includes(q) ||
          d.organizations?.name?.toLowerCase().includes(q)
      );
    }
    if (selectedTypes.length > 0) {
      list = list.filter((d) => d.project_type && selectedTypes.includes(d.project_type));
    }
    if (selectedRegions.length > 0) {
      list = list.filter((d) => selectedRegions.some(r => d.location?.includes(r)));
    }
    if (selectedFundingType) {
      list = list.filter((d) => d.funding_type === selectedFundingType);
    }
    if (maxRiskScore < 100) {
      list = list.filter((d) => (d.ai_risk_score ?? 0) <= maxRiskScore);
    }
    if (sortBy === "score") list.sort((a, b) => (a.ai_risk_score ?? 100) - (b.ai_risk_score ?? 100));
    else if (sortBy === "funding") list.sort((a, b) => (b.funding_amount ?? 0) - (a.funding_amount ?? 0));
    return list;
  }, [deals, search, selectedTypes, selectedRegions, selectedFundingType, maxRiskScore, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const visiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (currentPage > 4) pages.push("...");
      if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage);
      if (totalPages > 3) pages.push("...", totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Search bar */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              type="text"
              placeholder="Rechercher un projet (ex: Parc Solaire Namur-Sud)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>
          <button
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16523A" }}
          >
            <span className="material-symbols-outlined text-base">tune</span>
            Rechercher
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-7 items-start">

        {/* ── Sidebar Filters ── */}
        <aside className="w-56 shrink-0 space-y-6">

          {/* Type */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Type de projet</p>
            <div className="space-y-2.5">
              {Object.entries(TYPE_LABELS).filter(([k]) => ["solar","wind","storage","hydrogen"].includes(k)).map(([key, cfg]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => { toggleType(key); setPage(1); }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      selectedTypes.includes(key)
                        ? "border-primary bg-primary"
                        : "border-slate-300 bg-white group-hover:border-primary/50"
                    }`}
                  >
                    {selectedTypes.includes(key) && (
                      <span className="material-symbols-outlined text-white text-[10px]">check</span>
                    )}
                  </div>
                  <span
                    onClick={() => { toggleType(key); setPage(1); }}
                    className="text-sm text-slate-600 select-none"
                  >
                    {cfg.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Funding type */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Type de financement</p>
            <div className="relative">
              <select
                value={selectedFundingType}
                onChange={(e) => { setSelectedFundingType(e.target.value); setPage(1); }}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none pr-8"
              >
                <option value="">Tous les types</option>
                <option value="equity">Equity</option>
                <option value="debt">Dette</option>
                <option value="convertible">Convertible</option>
              </select>
              <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Région */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Région</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { toggleRegion(r); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    selectedRegions.includes(r)
                      ? "text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  style={selectedRegions.includes(r) ? { backgroundColor: "#16523A" } : {}}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Grade d'investissement */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Grade d&apos;investissement</p>
            <input
              type="range"
              min="0"
              max="100"
              value={maxRiskScore}
              onChange={(e) => { setMaxRiskScore(Number(e.target.value)); setPage(1); }}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>A+ (Premium)</span>
              <span>C (Risque)</span>
            </div>
          </div>

          {/* Help card */}
          <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: "#16523A" }}>
            <p className="font-bold text-sm mb-1">Besoin d&apos;aide ?</p>
            <p className="text-white/70 text-xs mb-4">Nos experts vous accompagnent dans le montage de vos dossiers financiers.</p>
            <button className="w-full py-2 rounded-xl text-xs font-bold text-primary transition-opacity hover:opacity-90" style={{ backgroundColor: "#B8FF3C" }}>
              Contactez-nous
            </button>
          </div>
        </aside>

        {/* ── Project grid ── */}
        <div className="flex-1 min-w-0">

          {/* Grid header */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-slate-500">
              Affichage de <span className="font-bold text-primary">{filtered.length}</span> projets
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-xs uppercase tracking-wide font-semibold">Trier par :</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 outline-none pr-7 font-medium"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-slate-400 text-sm absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Cards */}
          {paginated.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">search_off</span>
              <p className="text-slate-500 font-medium">Aucun projet ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginated.map((deal) => {
                const typeCfg = TYPE_LABELS[deal.project_type ?? "other"] ?? TYPE_LABELS.other;
                const statusCfg = STATUS_CONFIG[deal.status ?? "published"] ?? STATUS_CONFIG.published;
                const gradient = GRADIENT_BY_TYPE[deal.project_type ?? "other"] ?? GRADIENT_BY_TYPE.other;
                const progress = Math.min(100, (deal.interests_count ?? 0) * 10);
                const progressLabel = deal.project_type === "storage" ? "Progression" : "Avancement Financement";

                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image area */}
                    <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      {/* Visual overlay pattern */}
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(22,82,58,0.3) 0%, transparent 60%),
                                            radial-gradient(circle at 80% 20%, rgba(184,255,60,0.2) 0%, transparent 50%)`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <span className="material-symbols-outlined text-7xl text-slate-600">{typeCfg.icon}</span>
                      </div>

                      {/* Category badge */}
                      <span className={`absolute top-4 left-4 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 ${typeCfg.color}`}>
                        <span className="material-symbols-outlined text-xs">{typeCfg.icon}</span>
                        {typeCfg.label}
                      </span>

                      {/* IA Score badge */}
                      {deal.ai_risk_score != null && (
                        <div className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-extrabold text-primary flex flex-col items-center leading-tight"
                          style={{ backgroundColor: "#B8FF3C" }}>
                          <span className="text-[9px] uppercase tracking-wide font-bold">IA Score</span>
                          <span className="text-sm leading-none">{deal.ai_risk_score}%</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h4 className="font-bold text-primary text-base mb-1 line-clamp-1">{deal.title}</h4>

                      {(deal.organizations?.city || deal.organizations?.name) && (
                        <p className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {[deal.organizations.city, deal.organizations.name].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      {/* Metrics grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                            {deal.project_type === "hydrogen" ? "Production" : "Capacité"}
                          </p>
                          <p className="font-extrabold text-primary text-base">
                            {deal.capacity_mw != null
                              ? `${deal.capacity_mw} MW`
                              : deal.irr_target != null
                              ? `${deal.irr_target}%`
                              : formatAmount(deal.funding_amount)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                            {deal.project_type === "storage" ? "Rendement" : "Efficacité"}
                          </p>
                          <p className="font-extrabold text-primary text-base">
                            {deal.irr_target != null
                              ? `${deal.irr_target} %`
                              : deal.irr_target != null
                              ? `${deal.irr_target}%`
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                          <span>{progressLabel}</span>
                          <span className="font-bold">{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: "#B8FF3C" }}
                          />
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{statusCfg.label}</span>
                        </div>
                        <Link
                          href={`/investment/${deal.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-primary border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
                        >
                          View Details
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>

              {visiblePages().map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                      currentPage === p
                        ? "text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    style={currentPage === p ? { backgroundColor: "#16523A" } : {}}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
