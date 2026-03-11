import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResponseForm from "./ResponseForm";

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "⚡" },
  installer:       { label: "Installateur",          icon: "🔧" },
  software_editor: { label: "Éditeur logiciel",       icon: "💻" },
  investor:        { label: "Investisseur",           icon: "📈" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "🏭" },
  esco:            { label: "ESCO / Consultant",      icon: "🎯" },
  greentech:       { label: "GreenTech",              icon: "🌱" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  rfq: { label: "RFQ", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  rfi: { label: "RFI", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
  rfp: { label: "RFP", color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
};

const OPEN_STATUSES = ["published", "responses_open", "under_review"];

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch RFQ
  const { data: rfq } = await supabase
    .from("rfqs")
    .select(`
      *,
      organizations (id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("id", id)
    .neq("status", "draft")
    .single();

  if (!rfq) notFound();

  const typeCfg = TYPE_CONFIG[rfq.type] || TYPE_CONFIG.rfq;
  const org = rfq.organizations as {
    id: string; name: string; slug: string; actor_type: string;
    logo_url: string | null; city: string | null; is_verified: boolean;
  } | null;
  const orgType = org ? (ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "🏢" }) : null;

  const deadline = rfq.deadline
    ? new Date(rfq.deadline).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const isOpen = OPEN_STATUSES.includes(rfq.status);
  const rfqOwnerOrgId = org?.id || null;

  // Données user si connecté
  let memberOrgId: string | null = null;
  let existingResponse = null;
  let isLimitReached = false;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(subscription_plan)")
      .eq("id", user.id)
      .single();

    if (member) {
      memberOrgId = member.organization_id as string;
      const memberOrg = member.organizations as unknown as { subscription_plan: string } | null;

      // Réponse existante
      const { data: resp } = await supabase
        .from("rfq_responses")
        .select("message, price_range, delivery_timeline, submitted_at")
        .eq("rfq_id", id)
        .eq("organization_id", memberOrgId)
        .maybeSingle();
      existingResponse = resp;

      // Limite Free
      if (memberOrg?.subscription_plan === "free" && !resp) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("rfq_responses")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", memberOrgId)
          .gte("submitted_at", startOfMonth.toISOString());
        isLimitReached = (count || 0) >= 1;
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/rfq" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Retour aux appels d&apos;offres
          </Link>
        </div>

        <div className="flex gap-8 items-start">

          {/* ── Contenu principal ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Header */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeCfg.color}`}>
                  {typeCfg.label}
                </span>
                <span className="text-xs text-slate-500">
                  Publié le {rfq.published_at
                    ? new Date(rfq.published_at).toLocaleDateString("fr-BE")
                    : "—"}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mb-4 leading-snug">{rfq.title}</h1>

              {org && (
                <Link href={`/directory/${org.slug}`} className="flex items-center gap-3 group w-fit">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {org.logo_url
                      ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
                      : orgType?.icon || "🏢"}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors">
                      {org.name}
                      {org.is_verified && <span className="text-green-400 ml-1 text-xs">✓</span>}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {orgType?.icon} {orgType?.label}
                      {org.city && ` · ${org.city}`}
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.description}</p>
            </div>

            {/* Requirements */}
            {rfq.requirements && (
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Cahier des charges</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rfq.requirements}</p>
              </div>
            )}

            {/* Acteurs ciblés + tags */}
            {(rfq.target_actor_types?.length > 0 || rfq.tags?.length > 0) && (
              <div className="card p-6 space-y-4">
                {rfq.target_actor_types?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Acteurs recherchés</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.target_actor_types.map((type: string) => {
                        const info = ACTOR_LABELS[type] || { label: type, icon: "🏢" };
                        return (
                          <span key={type} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {info.icon} {info.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {rfq.tags?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formulaire de réponse — masqué pour le propriétaire */}
            {memberOrgId !== rfqOwnerOrgId && (
              <div id="respond">
                <h2 className="text-lg font-semibold text-white mb-4">Répondre à cet appel d&apos;offres</h2>
                <ResponseForm
                  rfqId={id}
                  isLoggedIn={!!user}
                  isOpen={isOpen}
                  isLimitReached={isLimitReached}
                  existingResponse={existingResponse}
                />
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-72 shrink-0 sticky top-8 space-y-4">

            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Détails</h3>
              {rfq.budget_range && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">💰</span>
                  <span className="text-slate-300">{rfq.budget_range}</span>
                </div>
              )}
              {deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📅</span>
                  <span className="text-slate-300">{deadline}</span>
                </div>
              )}
              {rfq.location && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📍</span>
                  <span className="text-slate-300">{rfq.location}</span>
                </div>
              )}
              {rfq.responses_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">📬</span>
                  <span className="text-slate-300">{rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            {rfq.ai_summary && (
              <div className="card p-5 border-green-400/10">
                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">🤖 Analyse IA</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rfq.ai_summary}</p>
              </div>
            )}

            {isOpen && user && !existingResponse && !isLimitReached && memberOrgId !== rfqOwnerOrgId && (
              <a href="#respond" className="btn-primary w-full block text-center">
                Répondre à ce RFQ →
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
