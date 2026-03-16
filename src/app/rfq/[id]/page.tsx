import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResponseForm from "./ResponseForm";

const ACTOR_LABELS: Record<string, { label: string; icon: string }> = {
  industrial:      { label: "Industriel",           icon: "factory" },
  installer:       { label: "Installateur",          icon: "handyman" },
  software_editor: { label: "Éditeur logiciel",       icon: "code" },
  investor:        { label: "Investisseur",           icon: "trending_up" },
  energy_provider: { label: "Fournisseur d'énergie",  icon: "bolt" },
  esco:            { label: "ESCO / Consultant",      icon: "psychology" },
  greentech:       { label: "GreenTech",              icon: "eco" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  rfq: { label: "RFQ", color: "bg-accent/20 text-primary border-accent/30" },
  rfi: { label: "RFI", color: "bg-blue-50 text-blue-600 border-blue-200" },
  rfp: { label: "RFP", color: "bg-purple-50 text-purple-600 border-purple-200" },
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
  const orgType = org ? (ACTOR_LABELS[org.actor_type] || { label: org.actor_type, icon: "business" }) : null;

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
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/rfq" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors w-fit">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Retour aux appels d&apos;offres
          </Link>
        </div>

        <div className="flex gap-8 items-start">

          {/* ── Contenu principal ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Header */}
            <div className="bg-white rounded-3xl p-8 border border-black/5">
              <div className="flex items-center gap-3 mb-5">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeCfg.color}`}>
                  {typeCfg.label}
                </span>
                <span className="text-xs text-slate-400">
                  Publié le {rfq.published_at
                    ? new Date(rfq.published_at).toLocaleDateString("fr-BE")
                    : "—"}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-primary mb-5 leading-snug font-display">{rfq.title}</h1>

              {org && (
                <Link href={`/directory/${org.slug}`} className="flex items-center gap-3 group w-fit">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {org.logo_url
                      ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-contain" />
                      : <span className="material-symbols-outlined text-slate-400">{orgType?.icon || "business"}</span>}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-primary group-hover:opacity-70 transition-opacity">
                      {org.name}
                      {org.is_verified && (
                        <span className="material-symbols-outlined text-green-500 text-xs ml-1 align-middle">verified</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <span className="material-symbols-outlined text-xs">{orgType?.icon || "business"}</span>
                      {orgType?.label}
                      {org.city && ` · ${org.city}`}
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-8 border border-black/5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4">Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{rfq.description}</p>
            </div>

            {/* Requirements */}
            {rfq.requirements && (
              <div className="bg-white rounded-3xl p-8 border border-black/5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4">Cahier des charges</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{rfq.requirements}</p>
              </div>
            )}

            {/* Acteurs ciblés + tags */}
            {(rfq.target_actor_types?.length > 0 || rfq.tags?.length > 0) && (
              <div className="bg-white rounded-3xl p-8 border border-black/5 space-y-5">
                {rfq.target_actor_types?.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3">Acteurs recherchés</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.target_actor_types.map((type: string) => {
                        const info = ACTOR_LABELS[type] || { label: type, icon: "business" };
                        return (
                          <span
                            key={type}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: "rgba(22,82,58,0.08)", color: "#16523A" }}
                          >
                            <span className="material-symbols-outlined text-xs">{info.icon}</span>
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {rfq.tags?.length > 0 && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-3">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfq.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: "rgba(22,82,58,0.07)", color: "#16523A" }}
                        >
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
                <h2 className="text-lg font-bold text-primary mb-4 font-display">Répondre à cet appel d&apos;offres</h2>
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

            <div className="bg-white rounded-3xl p-6 border border-black/5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary/50">Détails</h3>
              {rfq.budget_range && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary/50 text-base">payments</span>
                  <span className="text-slate-700">{rfq.budget_range}</span>
                </div>
              )}
              {deadline && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary/50 text-base">calendar_today</span>
                  <span className="text-slate-700">{deadline}</span>
                </div>
              )}
              {rfq.location && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary/50 text-base">location_on</span>
                  <span className="text-slate-700">{rfq.location}</span>
                </div>
              )}
              {rfq.responses_count > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary/50 text-base">mail</span>
                  <span className="text-slate-700">{rfq.responses_count} réponse{rfq.responses_count > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            {rfq.ai_summary && (
              <div className="bg-primary rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-accent text-base">auto_awesome</span>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-accent">Analyse IA</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{rfq.ai_summary}</p>
              </div>
            )}

            {isOpen && user && !existingResponse && !isLimitReached && memberOrgId !== rfqOwnerOrgId && (
              <a
                href="#respond"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#16523A" }}
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                Répondre à ce RFQ
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
