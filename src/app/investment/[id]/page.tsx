// src/app/investment/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import InterestButton from "./InterestButton";

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select(`
      *,
      organizations (id, name, logo_url, city, actor_type)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!deal) notFound();

  // Increment views_count (best-effort, not awaited)
  void supabase
    .from("deals")
    .update({ views_count: (deal.views_count ?? 0) + 1 })
    .eq("id", id);

  // Check if current user already expressed interest
  const { data: { user } } = await supabase.auth.getUser();
  let alreadyExpressed = false;

  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (member) {
      const { data: existing } = await supabase
        .from("deal_interests")
        .select("id")
        .eq("deal_id", id)
        .eq("investor_org_id", member.organization_id)
        .maybeSingle();
      alreadyExpressed = !!existing;
    }
  }

  const org = deal.organizations as unknown as {
    name: string;
    city: string | null;
    logo_url: string | null;
    actor_type: string;
  } | null;

  function formatAmount(amount: number | null): string {
    if (!amount) return "Montant non précisé";
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
    return `${amount.toLocaleString("fr-FR")} €`;
  }

  const PROJECT_TYPE_LABELS: Record<string, string> = {
    solar: "Solaire", wind: "Éolien", storage: "Stockage",
    efficiency: "Efficacité énergétique", other: "Autre",
  };
  const FUNDING_TYPE_LABELS: Record<string, string> = {
    equity: "Equity", debt: "Dette", convertible: "Convertible", grant: "Subvention",
  };

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <Link href="/investment" className="text-slate-500 text-sm hover:text-slate-300 mb-6 inline-block">
          ← Retour aux deals
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              {deal.project_type && (
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest block mb-2">
                  {PROJECT_TYPE_LABELS[deal.project_type] || deal.project_type}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{deal.title}</h1>
            </div>
            {deal.requires_nda && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30 text-orange-400 bg-orange-500/10 whitespace-nowrap">
                NDA requis
              </span>
            )}
          </div>
          <p className="text-slate-400">
            {org?.name}
            {org?.city ? ` · ${org.city}` : ""}
            {deal.published_at ? ` · Publié le ${new Date(deal.published_at).toLocaleDateString("fr-FR")}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Description</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{deal.description}</p>
            </div>

            {/* Infos projet */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Projet</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {deal.location && (
                  <>
                    <dt className="text-slate-500">Localisation</dt>
                    <dd className="text-slate-300">{deal.location}</dd>
                  </>
                )}
                {deal.capacity_mw && (
                  <>
                    <dt className="text-slate-500">Capacité</dt>
                    <dd className="text-slate-300">{deal.capacity_mw} MW</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Financement */}
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Financement</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <dt className="text-slate-500">Montant recherché</dt>
                <dd className="text-green-400 font-semibold">{formatAmount(deal.funding_amount)}</dd>
                {deal.funding_type && (
                  <>
                    <dt className="text-slate-500">Type</dt>
                    <dd className="text-slate-300">{FUNDING_TYPE_LABELS[deal.funding_type] || deal.funding_type}</dd>
                  </>
                )}
                {deal.series && (
                  <>
                    <dt className="text-slate-500">Série</dt>
                    <dd className="text-slate-300">{deal.series}</dd>
                  </>
                )}
                {deal.irr_target && (
                  <>
                    <dt className="text-slate-500">IRR cible</dt>
                    <dd className="text-slate-300">{deal.irr_target}%</dd>
                  </>
                )}
                {deal.duration_years && (
                  <>
                    <dt className="text-slate-500">Durée</dt>
                    <dd className="text-slate-300">{deal.duration_years} ans</dd>
                  </>
                )}
                {deal.current_investors && (
                  <>
                    <dt className="text-slate-500">Investisseurs actuels</dt>
                    <dd className="text-slate-300">{deal.current_investors}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Section IA */}
            {deal.ai_summary && (
              <div className="card p-6 border-purple-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Analyse IA</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Résumé</p>
                    <p className="text-slate-300 text-sm">{deal.ai_summary}</p>
                  </div>
                  {deal.ai_investment_thesis && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Thèse d&apos;investissement</p>
                      <p className="text-slate-300 text-sm">{deal.ai_investment_thesis}</p>
                    </div>
                  )}
                  {deal.ai_risk_score !== null && deal.ai_risk_score !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-500">Score de risque</p>
                        <span className={`text-sm font-bold ${
                          deal.ai_risk_score <= 33 ? "text-green-400" :
                          deal.ai_risk_score <= 66 ? "text-yellow-500" : "text-red-400"
                        }`}>
                          {deal.ai_risk_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            deal.ai_risk_score <= 33 ? "bg-green-400" :
                            deal.ai_risk_score <= 66 ? "bg-yellow-500" : "bg-red-400"
                          }`}
                          style={{ width: `${deal.ai_risk_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                        <span>Faible risque</span>
                        <span>Risque élevé</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA */}
            <div className="card p-6">
              <div className="text-sm text-slate-400 mb-4">
                {deal.interests_count ?? 0} investisseur{(deal.interests_count ?? 0) !== 1 ? "s" : ""} intéressé{(deal.interests_count ?? 0) !== 1 ? "s" : ""}
              </div>
              {user ? (
                <InterestButton
                  dealId={id}
                  requiresNda={deal.requires_nda ?? false}
                  alreadyExpressed={alreadyExpressed}
                />
              ) : (
                <Link href={`/login?redirect=/investment/${id}`} className="btn-primary block text-center">
                  Se connecter pour investir
                </Link>
              )}
              {deal.requires_nda && (
                <p className="text-xs text-slate-600 mt-3 text-center">
                  Accord de confidentialité requis
                </p>
              )}
            </div>

            {/* Documents */}
            {(deal.pitch_deck_url || deal.financial_model_url) && (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Documents</h3>
                <div className="space-y-2">
                  {deal.pitch_deck_url && (
                    <a href={deal.pitch_deck_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full text-sm block text-center">
                      Pitch deck
                    </a>
                  )}
                  {deal.financial_model_url && (
                    <a href={deal.financial_model_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full text-sm block text-center">
                      Modèle financier
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
