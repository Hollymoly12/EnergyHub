import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

export default async function ActorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Incrémenter les vues en arrière-plan
  supabase
    .from("organizations")
    .update({ profile_views: (org.profile_views || 0) + 1 })
    .eq("id", org.id)
    .then(() => {});

  const typeInfo = ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" };
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">

        <Link href="/directory" className="text-sm text-slate-500 hover:text-white transition-colors inline-flex items-center gap-1.5 mb-6">
          ← Retour à l'annuaire
        </Link>

        {/* Cover */}
        <div className="card overflow-hidden mb-6">
          <div
            className="h-32 bg-gradient-to-r from-slate-800 to-slate-900"
            style={org.cover_image_url ? {
              backgroundImage: `url(${org.cover_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                {org.logo_url
                  ? <img src={org.logo_url} alt="" className="w-full h-full object-contain" />
                  : typeInfo.icon}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-white">{org.name}</h1>
                  {org.is_verified && (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      ✓ Vérifié
                    </span>
                  )}
                  {org.subscription_plan === "pro" && (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {typeInfo.icon} {typeInfo.label}
                  {org.city && ` · ${org.city}`}
                  {org.region && `, ${org.region}`}
                  {org.founded_year && ` · Fondée en ${org.founded_year}`}
                </div>
              </div>
            </div>

            {org.reviews_count > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= Math.round(org.rating) ? "text-yellow-500" : "text-slate-700"}`}>★</span>
                  ))}
                </div>
                <span className="text-sm text-slate-500">
                  {org.rating.toFixed(1)} ({org.reviews_count} avis)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            {org.description && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-white mb-3">À propos</h2>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {org.description}
                </p>
              </div>
            )}

            {((org.tags?.length > 0) || (org.technologies?.length > 0) || (org.certifications?.length > 0)) && (
              <div className="card p-6 space-y-4">
                {org.tags?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {org.technologies?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.technologies.map((tech: string) => (
                        <span key={tech} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {org.certifications?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {org.certifications.map((cert: string) => (
                        <span key={cert} className="text-xs px-3 py-1 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(org.team_size || org.annual_revenue) && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-white mb-3">Informations</h2>
                <div className="grid grid-cols-2 gap-4">
                  {org.team_size && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Équipe</div>
                      <div className="text-sm text-white">{org.team_size} employés</div>
                    </div>
                  )}
                  {org.annual_revenue && (
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Chiffre d'affaires</div>
                      <div className="text-sm text-white">{org.annual_revenue}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne contact */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Contact</h2>

              {isLoggedIn ? (
                <div className="space-y-3">
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <span>🌐</span>
                      <span className="truncate">{org.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>📞</span>
                      <span>{org.phone}</span>
                    </div>
                  )}
                  {org.linkedin_url && (
                    <a href={org.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
                      <span>💼</span>
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {!org.website && !org.phone && !org.linkedin_url && (
                    <p className="text-xs text-slate-600">Aucune coordonnée renseignée</p>
                  )}
                  <button
                    disabled
                    className="btn-primary w-full mt-2 opacity-50 cursor-not-allowed"
                    title="Messagerie disponible prochainement"
                  >
                    ✉ Contacter
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="space-y-3 select-none blur-sm pointer-events-none">
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>🌐</span><span>www.example.be</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>📞</span><span>+32 2 000 00 00</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span>💼</span><span>LinkedIn</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-lg text-center p-3">
                    <div className="text-sm font-semibold text-white mb-1">🔒 Coordonnées masquées</div>
                    <div className="text-xs text-slate-500 mb-3">
                      Inscrivez-vous gratuitement pour voir les coordonnées
                    </div>
                    <a href="/register" className="btn-primary text-xs py-1.5 px-4">
                      S'inscrire →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {org.profile_views > 0 && (
              <div className="text-xs text-slate-600 text-center">
                👁 {org.profile_views} vue{org.profile_views > 1 ? "s" : ""} du profil
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
