// src/app/dashboard/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Investissement — Dashboard EnergyHub",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "text-slate-400 border-slate-700 bg-slate-800/50" },
  published: { label: "Publié", color: "text-green-400 border-green-500/30 bg-green-500/10" },
  under_review: { label: "En revue", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10" },
  closed: { label: "Clôturé", color: "text-slate-500 border-slate-700 bg-slate-800/50" },
};

const INTEREST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  interested: { label: "Intéressé", color: "text-blue-400" },
  in_discussion: { label: "En discussion", color: "text-yellow-500" },
  passed: { label: "Passé", color: "text-slate-500" },
};

export default async function DashboardInvestmentPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(name)")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/dashboard");
  const orgId = member.organization_id as string;

  // Fetch my deals
  const { data: myDeals } = await supabase
    .from("deals")
    .select("id, title, status, views_count, interests_count, published_at, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // Fetch interests received on my deals (join through deal_id)
  const myDealIds = (myDeals ?? []).map((d) => d.id);
  const { data: interestsReceived } = myDealIds.length > 0
    ? await supabase
        .from("deal_interests")
        .select(`
          id, message, nda_signed, status, created_at,
          deals (id, title),
          organizations!investor_org_id (id, name, city, actor_type)
        `)
        .in("deal_id", myDealIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Dashboard</div>
          <h1 className="text-2xl font-bold text-white">Module Investissement</h1>
        </div>
        <Link href="/investment/submit" className="btn-primary">
          Nouveau deal +
        </Link>
      </div>

      {/* Success banner */}
      {submitted === "1" && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Deal soumis avec succès ! L&apos;analyse IA a été générée automatiquement.
        </div>
      )}

      {/* Mes deals */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Mes deals</h2>
        {!myDeals || myDeals.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <p className="mb-4">Vous n&apos;avez pas encore soumis de deal.</p>
            <Link href="/investment/submit" className="btn-primary inline-block">
              Soumettre un premier deal →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myDeals.map((deal) => {
              const cfg = STATUS_CONFIG[deal.status] || STATUS_CONFIG.draft;
              return (
                <div key={deal.id} className="card p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Link href={`/investment/${deal.id}`} className="text-white font-medium hover:text-yellow-500 transition-colors">
                      {deal.title}
                    </Link>
                    <p className="text-slate-500 text-xs mt-1">
                      {deal.views_count ?? 0} vue{(deal.views_count ?? 0) !== 1 ? "s" : ""} ·{" "}
                      {deal.interests_count ?? 0} intérêt{(deal.interests_count ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Intérêts reçus */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Intérêts reçus</h2>
        {!interestsReceived || interestsReceived.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            Aucun investisseur n&apos;a encore exprimé son intérêt pour vos deals.
          </div>
        ) : (
          <div className="space-y-3">
            {interestsReceived.map((interest) => {
              const deal = interest.deals as unknown as { id: string; title: string } | null;
              const investorOrg = interest.organizations as unknown as { name: string; city: string | null; actor_type: string } | null;
              const statusCfg = INTEREST_STATUS_CONFIG[interest.status] || INTEREST_STATUS_CONFIG.interested;
              return (
                <div key={interest.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div>
                      <p className="text-white font-medium">{investorOrg?.name ?? "Organisation inconnue"}</p>
                      {investorOrg?.city && (
                        <p className="text-slate-500 text-xs">{investorOrg.city} · {investorOrg.actor_type}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                      <p className="text-slate-600 text-xs mt-1">
                        {new Date(interest.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  {deal && (
                    <p className="text-slate-500 text-xs mb-2">
                      Deal : <Link href={`/investment/${deal.id}`} className="text-slate-400 hover:text-white">{deal.title}</Link>
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span className={interest.nda_signed ? "text-green-400" : "text-slate-600"}>
                      NDA {interest.nda_signed ? "signé" : "non signé"}
                    </span>
                    {interest.message && (
                      <span className="text-slate-400 italic">&ldquo;{interest.message}&rdquo;</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
