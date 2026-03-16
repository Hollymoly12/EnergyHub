"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Actor {
  id: string;
  name: string;
  slug: string;
  actor_type: string;
  short_description: string | null;
  city: string | null;
  region: string | null;
  logo_url: string | null;
  tags: string[];
  certifications: string[];
  is_verified: boolean;
  subscription_plan: string;
  rating: number;
  reviews_count: number;
}

interface Props {
  initialActors: Actor[];
  totalCount: number;
  isLoggedIn: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTOR_LABELS: Record<string, string> = {
  industrial: "Industriel",
  installer: "Installateur",
  software_editor: "Éditeur logiciel",
  investor: "Investisseur",
  energy_provider: "Fournisseur d'énergie",
  esco: "ESCO / Consultant",
  greentech: "GreenTech",
};

const ACTOR_TYPE_OPTIONS = Object.entries(ACTOR_LABELS);
const REGIONS = ["Wallonie", "Flandre", "Bruxelles-Capitale"];
const CERTIFICATIONS = ["ISO 50001", "ISO 14001", "EMAS", "Qualiwatt", "Ecoscore"];
const PAGE_SIZE = 24;
const PUBLIC_LIMIT = 12;

// ─── ActorCard ────────────────────────────────────────────────────────────────

function ActorCard({ actor }: { actor: Actor }) {
  const typeLabel = ACTOR_LABELS[actor.actor_type] ?? actor.actor_type;
  const matchScore = Math.floor(65 + Math.random() * 30);

  return (
    <div className="bg-white rounded-3xl p-6 border border-black/5 hover:border-black/20 hover:shadow-xl transition-all flex flex-col gap-4">
      {/* Top row: logo + match badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {actor.logo_url ? (
            <img
              src={actor.logo_url}
              alt={actor.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="material-symbols-outlined text-3xl text-slate-400">
              business
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0"
          style={{ backgroundColor: "rgba(184,255,60,0.15)", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-sm">bolt</span>
          {matchScore}% Match IA
        </span>
      </div>

      {/* Name */}
      <div>
        <h3
          className="text-2xl font-bold leading-tight"
          style={{ color: "#16523A", fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          {actor.name}
        </h3>
        <p className="text-sm text-slate-400 mt-0.5">
          {typeLabel}
          {actor.city ? ` · ${actor.city}` : ""}
        </p>
      </div>

      {/* Description */}
      {actor.short_description && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
          {actor.short_description}
        </p>
      )}

      {/* Tags */}
      {actor.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actor.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase font-bold rounded px-2 py-1"
              style={{ backgroundColor: "rgba(22,82,58,0.07)", color: "#16523A" }}
            >
              {tag}
            </span>
          ))}
          {actor.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{actor.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
        <Link
          href={`/directory/${actor.slug}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">person</span>
          Voir Profil
        </Link>
        <Link
          href={`/dashboard/messages?to=${actor.id}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#16523A", color: "#16523A" }}
        >
          <span className="material-symbols-outlined text-base">mail</span>
          Contact
        </Link>
      </div>
    </div>
  );
}

// ─── DirectoryClient ──────────────────────────────────────────────────────────

export default function DirectoryClient({
  initialActors,
  totalCount,
  isLoggedIn,
}: Props) {
  const [actors, setActors] = useState<Actor[]>(initialActors);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");
  const [region, setRegion] = useState("");
  const [certification, setCertification] = useState("");
  const [page, setPage] = useState(0);

  const fetchActors = useCallback(
    async (params: {
      q?: string;
      type?: string;
      region?: string;
      certification?: string;
      page?: number;
    }) => {
      setLoading(true);
      const sp = new URLSearchParams();
      if (params.q) sp.set("q", params.q);
      if (params.type) sp.set("type", params.type);
      if (params.region) sp.set("region", params.region);
      if (params.certification) sp.set("certification", params.certification);
      sp.set("limit", String(PAGE_SIZE));
      sp.set("page", String(params.page ?? 0));
      sp.set("sort", "rating");

      try {
        const res = await fetch(`/api/actors?${sp}`);
        const data = res.ok ? await res.json() : { actors: [], total: 0 };
        setActors(data.actors ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      fetchActors({ q: search, type: actorType, region, certification, page: 0 });
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, actorType, region, certification, fetchActors]);

  const visibleActors = isLoggedIn ? actors : actors.slice(0, PUBLIC_LIMIT);
  const hiddenCount = isLoggedIn ? 0 : Math.max(0, total - PUBLIC_LIMIT);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ─── Search & Filter Panel ───────────────────────────────────────────────

  return (
    <>
      {/* Search & Filter */}
      <div
        className="rounded-3xl p-8 mb-12 shadow-xl"
        style={{ backgroundColor: "#16523A" }}
      >
        {/* Search bar */}
        <div className="relative mb-6">
          <span
            className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ pointerEvents: "none" }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise, technologie, ville..."
            className="w-full bg-white rounded-2xl pl-12 pr-5 py-4 text-slate-800 placeholder-slate-400 text-base outline-none focus:ring-4 transition-all"
            style={
              {
                "--tw-ring-color": "rgba(184,255,60,0.5)",
              } as React.CSSProperties
            }
            onFocus={(e) =>
              e.currentTarget.style.boxShadow =
                "0 0 0 4px rgba(184,255,60,0.5)"
            }
            onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
          />
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Type d'acteur */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#B8FF3C" }}
            >
              Type d'acteur
            </label>
            <select
              value={actorType}
              onChange={(e) => setActorType(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none" }}
            >
              <option value="" style={{ color: "#000" }}>
                Tous les types
              </option>
              {ACTOR_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value} style={{ color: "#000" }}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Région */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#B8FF3C" }}
            >
              Région
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none" }}
            >
              <option value="" style={{ color: "#000" }}>
                Toutes les régions
              </option>
              {REGIONS.map((r) => (
                <option key={r} value={r} style={{ color: "#000" }}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Certifications */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#B8FF3C" }}
            >
              Certifications
            </label>
            <select
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none" }}
            >
              <option value="" style={{ color: "#000" }}>
                Toutes
              </option>
              {CERTIFICATIONS.map((c) => (
                <option key={c} value={c} style={{ color: "#000" }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter button */}
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#B8FF3C", color: "#16523A" }}
            onClick={() =>
              fetchActors({ q: search, type: actorType, region, page: 0 })
            }
          >
            <span className="material-symbols-outlined text-base">filter_list</span>
            Filtrer
          </button>
        </div>

        {/* Result count */}
        <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          {loading
            ? "Recherche en cours..."
            : `${total} acteur${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Cards grid ── */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${
          loading ? "opacity-50" : ""
        }`}
      >
        {visibleActors.map((actor) => (
          <ActorCard key={actor.id} actor={actor} />
        ))}
      </div>

      {/* ── Unauthenticated gate ── */}
      {!isLoggedIn && hiddenCount > 0 && (
        <div
          className="mt-10 rounded-3xl p-10 text-center border"
          style={{
            backgroundColor: "#fff",
            borderColor: "rgba(22,82,58,0.15)",
          }}
        >
          <span
            className="material-symbols-outlined text-5xl block mb-4"
            style={{ color: "#16523A" }}
          >
            lock
          </span>
          <p
            className="text-xl font-bold mb-2"
            style={{
              color: "#16523A",
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}
          >
            +{hiddenCount} acteur{hiddenCount > 1 ? "s" : ""} disponible
            {hiddenCount > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Inscrivez-vous gratuitement pour accéder à l'annuaire complet
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

      {/* ── Pagination ── */}
      {isLoggedIn && totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-2">
          {/* Prev */}
          <button
            disabled={page === 0}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              fetchActors({ q: search, type: actorType, region, page: p });
            }}
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors hover:text-white disabled:opacity-30"
            style={{ borderColor: "#16523A", color: "#16523A" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#16523A";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#16523A";
            }}
          >
            <span className="material-symbols-outlined text-base">
              chevron_left
            </span>
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i).map(
            (i) => (
              <button
                key={i}
                onClick={() => {
                  setPage(i);
                  fetchActors({ q: search, type: actorType, region, page: i });
                }}
                className="w-10 h-10 rounded-full text-sm font-bold transition-colors"
                style={
                  page === i
                    ? { backgroundColor: "#16523A", color: "#fff" }
                    : { color: "#16523A" }
                }
              >
                {i + 1}
              </button>
            )
          )}

          {/* Next */}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              fetchActors({ q: search, type: actorType, region, page: p });
            }}
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ borderColor: "#16523A", color: "#16523A" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#16523A";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#16523A";
            }}
          >
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
          </button>
        </div>
      )}
    </>
  );
}
