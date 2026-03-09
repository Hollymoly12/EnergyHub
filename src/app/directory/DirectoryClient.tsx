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

// ─── ActorCard ────────────────────────────────────────────────────────────────

function ActorCard({ actor }: { actor: Actor }) {
  const typeInfo = ACTOR_LABELS[actor.actor_type] || { label: actor.actor_type, icon: "🏢" };

  return (
    <Link href={`/directory/${actor.slug}`} className="card p-5 hover:border-slate-700 transition-all group block">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {actor.logo_url
            ? <img src={actor.logo_url} alt="" className="w-full h-full object-contain" />
            : typeInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
              {actor.name}
            </span>
            {actor.is_verified && (
              <span className="text-[10px] text-green-400 font-bold shrink-0">✓</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {typeInfo.icon} {typeInfo.label}
            {actor.city && ` · ${actor.city}`}
          </div>
        </div>
      </div>

      {actor.short_description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
          {actor.short_description}
        </p>
      )}

      {actor.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {actor.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tag}
            </span>
          ))}
          {actor.tags.length > 3 && (
            <span className="text-[10px] text-slate-600">+{actor.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} className={`text-[10px] ${s <= Math.round(actor.rating) ? "text-yellow-500" : "text-slate-700"}`}>★</span>
          ))}
          {actor.reviews_count > 0 && (
            <span className="text-[10px] text-slate-600 ml-1">({actor.reviews_count})</span>
          )}
        </div>
        {actor.subscription_plan === "pro" && (
          <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">PRO</span>
        )}
        {actor.subscription_plan === "enterprise" && (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">ENTERPRISE</span>
        )}
      </div>
    </Link>
  );
}

// ─── DirectoryClient ──────────────────────────────────────────────────────────

export default function DirectoryClient({ initialActors, totalCount, isLoggedIn }: Props) {
  const [actors, setActors] = useState<Actor[]>(initialActors);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");
  const [region, setRegion] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(0);

  const fetchActors = useCallback(async (params: {
    q?: string; type?: string; region?: string;
    verified?: boolean; page?: number;
  }) => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.type) sp.set("type", params.type);
    if (params.region) sp.set("region", params.region);
    if (params.verified) sp.set("verified", "true");
    sp.set("limit", "24");
    sp.set("page", String(params.page || 0));
    sp.set("sort", "rating");

    try {
      const res = await fetch(`/api/actors?${sp}`);
      const data = res.ok ? await res.json() : { actors: [], total: 0 };
      setActors(data.actors || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: 0 });
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, actorType, region, verifiedOnly, fetchActors]);

  const visibleActors = isLoggedIn ? actors : actors.slice(0, PUBLIC_LIMIT);
  const hiddenCount = isLoggedIn ? 0 : Math.max(0, total - PUBLIC_LIMIT);

  return (
    <div className="flex gap-6 items-start">

      {/* ── Sidebar filtres ── */}
      <aside className="w-60 shrink-0 sticky top-8">
        <div className="card p-5 space-y-6">

          <div>
            <label className="label">Recherche</label>
            <input
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, ville, technologie..."
            />
          </div>

          <div>
            <label className="label">Type d'acteur</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="type" checked={actorType === ""}
                  onChange={() => setActorType("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Tous</span>
              </label>
              {ACTOR_TYPES.map(([value, { label, icon }]) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="type" checked={actorType === value}
                    onChange={() => setActorType(value)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Région</label>
            <div className="space-y-1.5 mt-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="radio" name="region" checked={region === ""}
                  onChange={() => setRegion("")}
                  className="accent-yellow-500" />
                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Toutes</span>
              </label>
              {REGIONS.map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="radio" name="region" checked={region === r}
                    onChange={() => setRegion(r)}
                    className="accent-yellow-500" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="accent-yellow-500" />
            <span className="text-sm text-slate-400">Vérifiés uniquement</span>
          </label>

          {(search || actorType || region || verifiedOnly) && (
            <button
              onClick={() => { setSearch(""); setActorType(""); setRegion(""); setVerifiedOnly(false); }}
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
            {loading ? "Recherche..." : `${total} acteur${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {visibleActors.map(actor => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </div>

        {!isLoggedIn && hiddenCount > 0 && (
          <div className="mt-6 card p-8 text-center border-yellow-500/20">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-white font-semibold mb-1">
              +{hiddenCount} acteur{hiddenCount > 1 ? "s" : ""} disponible{hiddenCount > 1 ? "s" : ""}
            </div>
            <div className="text-slate-500 text-sm mb-4">
              Inscrivez-vous gratuitement pour accéder à l'annuaire complet
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/register" className="btn-primary">S'inscrire gratuitement →</a>
              <a href="/login" className="btn-secondary">Se connecter</a>
            </div>
          </div>
        )}

        {isLoggedIn && total > 24 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={page === 0}
              onClick={() => { const p = page - 1; setPage(p); fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: p }); }}
              className="btn-secondary py-2 px-4 text-xs disabled:opacity-30"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-500 flex items-center px-4">
              Page {page + 1} / {Math.ceil(total / 24)}
            </span>
            <button
              disabled={(page + 1) * 24 >= total}
              onClick={() => { const p = page + 1; setPage(p); fetchActors({ q: search, type: actorType, region, verified: verifiedOnly, page: p }); }}
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
