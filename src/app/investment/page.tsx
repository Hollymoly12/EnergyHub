// src/app/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Investissement — EnergyHub",
  description: "Découvrez les opportunités d'investissement dans la transition énergétique belge.",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  solar: "Solaire",
  wind: "Éolien",
  storage: "Stockage",
  efficiency: "Efficacité énergétique",
  other: "Autre",
};

function formatAmount(amount: number | null): string {
  if (!amount) return "N/A";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M€`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} K€`;
  return `${amount.toLocaleString("fr-FR")} €`;
}

interface DealOrg {
  name: string;
  city: string | null;
}

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
  ai_score: number | null;
  organizations: DealOrg | null;
}

export default async function InvestmentPage() {
  const supabase = await createClient();

  const { data: rawDeals } = await supabase
    .from("deals")
    .select(`
      id, title, description, project_type, funding_amount, funding_type,
      irr_target, published_at, interests_count, ai_score,
      organizations (name, city)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const deals: Deal[] = (rawDeals ?? []).map((deal: Record<string, unknown>) => ({
    ...deal,
    organizations: Array.isArray(deal.organizations)
      ? (deal.organizations[0] ?? null)
      : (deal.organizations as DealOrg | null),
  })) as Deal[];

  // Mock stats for the hero dashboard
  const totalDeals = deals.length;
  const totalFunding = deals.reduce((sum, d) => sum + (d.funding_amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#FAFAF7]" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#16523A] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#B8FF3C] text-2xl">bolt</span>
            <span className="text-white font-extrabold text-xl tracking-tight">EnergyHub</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/directory" className="hover:text-white transition-colors">Projets</Link>
            <Link
              href="/investment"
              className="text-white border-b-2 border-[#B8FF3C] pb-0.5"
            >
              Investissements
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Insights</Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm text-white/60">
              <span className="material-symbols-outlined text-base">search</span>
              <span>Rechercher...</span>
            </div>
            <button className="relative text-white/70 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <div className="size-8 rounded-full bg-[#B8FF3C] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#16523A] text-base">person</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Dashboard Summary Hero */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h2
            className="text-3xl font-extrabold text-[#16523A]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Tableau de Bord
          </h2>
          <Link
            href="/investment/submit"
            className="flex items-center gap-2 bg-[#16523A] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a6347] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nouvel Investissement
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Total Investi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Total en Financement</p>
              <p className="text-2xl font-extrabold text-[#16523A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {formatAmount(totalFunding)}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                Actif
              </span>
            </div>
            <div className="size-12 rounded-xl bg-[#16523A]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#16523A]">account_balance_wallet</span>
            </div>
          </div>

          {/* ROI Portefeuille */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">ROI Moyen Cible</p>
              <p className="text-2xl font-extrabold text-[#16523A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {deals.length > 0 && deals.some((d) => d.irr_target)
                  ? `${(
                      deals
                        .filter((d) => d.irr_target)
                        .reduce((sum, d) => sum + (d.irr_target ?? 0), 0) /
                      deals.filter((d) => d.irr_target).length
                    ).toFixed(1)}%`
                  : "—"}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 bg-slate-50 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">
                IRR annuel
              </span>
            </div>
            <div className="size-12 rounded-xl bg-[#16523A]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#16523A]">show_chart</span>
            </div>
          </div>

          {/* Projets Actifs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Projets Actifs</p>
              <p className="text-2xl font-extrabold text-[#16523A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {totalDeals}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 bg-[#B8FF3C]/30 text-[#16523A] text-xs font-bold px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-xs">electric_bolt</span>
                En cours
              </span>
            </div>
            <div className="size-12 rounded-xl bg-[#B8FF3C]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#16523A]">electric_bolt</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8 items-start">
          {/* Project Cards Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3
                className="text-xl font-extrabold text-[#16523A]"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Marketplace des Projets
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {["Tous", "Solaire", "Éolien", "Stockage", "Efficacité"].map((filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      filter === "Tous"
                        ? "bg-[#16523A] text-white border-[#16523A]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#16523A] hover:text-[#16523A]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {deals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">inbox</span>
                <p className="text-slate-500 font-medium">Aucun projet disponible pour le moment.</p>
                <p className="text-slate-400 text-sm mt-1">Revenez bientôt ou soumettez votre deal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {deals.map((deal) => {
                  const progress = Math.min(
                    100,
                    Math.round(((deal.interests_count ?? 0) / 10) * 100)
                  );
                  return (
                    <Link
                      key={deal.id}
                      href={`/investment/${deal.id}`}
                      className="block bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      {/* Image placeholder */}
                      <div className="relative h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-slate-300">
                            {deal.project_type === "solar"
                              ? "wb_sunny"
                              : deal.project_type === "wind"
                              ? "air"
                              : deal.project_type === "storage"
                              ? "battery_charging_full"
                              : "bolt"}
                          </span>
                        </div>
                        {/* Category badge */}
                        {deal.project_type && (
                          <span className="absolute top-4 left-4 bg-[#B8FF3C] text-[#16523A] text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg">
                            {PROJECT_TYPE_LABELS[deal.project_type] ?? deal.project_type}
                          </span>
                        )}
                        {/* IA Score badge */}
                        {deal.ai_score != null && (
                          <span className="absolute top-4 right-4 flex items-center gap-1 bg-[#16523A] text-white text-xs font-bold px-2.5 py-1 rounded-xl">
                            <span className="material-symbols-outlined text-xs">psychology</span>
                            {deal.ai_score}/100
                          </span>
                        )}
                      </div>

                      {/* Card content */}
                      <div className="p-5">
                        <h4
                          className="text-base font-bold text-[#16523A] mb-1 group-hover:underline line-clamp-2"
                          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                          {deal.title}
                        </h4>

                        {deal.organizations?.city && (
                          <p className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {deal.organizations.city}
                            {deal.organizations.name ? ` · ${deal.organizations.name}` : ""}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">ROI Cible</p>
                            <p className="font-bold text-[#16523A]">
                              {deal.irr_target != null ? `${deal.irr_target}%` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Objectif</p>
                            <p className="font-bold text-[#16523A]">{formatAmount(deal.funding_amount)}</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{deal.interests_count ?? 0} intéressés</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#16523A] rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* IA Insights Sidebar */}
          <div className="w-96 shrink-0 space-y-5">
            {/* IA Insights */}
            <div className="bg-[#16523A] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-[#B8FF3C]">auto_awesome</span>
                <h3
                  className="font-extrabold text-lg"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  IA Insights
                </h3>
              </div>

              <div className="space-y-3 mb-5">
                {/* Insight 1 */}
                <div className="bg-white/10 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#B8FF3C] text-base">trending_up</span>
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wide">
                      Secteur Tendance
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    Le solaire distribué connaît une croissance de 34% en Belgique ce trimestre.
                    Forte demande industrielle.
                  </p>
                </div>

                {/* Insight 2 */}
                <div className="bg-white/10 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#B8FF3C] text-base">shield</span>
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wide">
                      Évaluation Risque
                    </span>
                  </div>
                  <p className="text-sm text-white/80">
                    Environnement réglementaire stable. La directive EU ETS renforce la rentabilité
                    des projets bas-carbone.
                  </p>
                </div>
              </div>

              <button className="w-full bg-[#B8FF3C] text-[#16523A] font-bold text-sm py-2.5 rounded-xl hover:bg-[#a8ef2c] transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">description</span>
                Rapport Complet
              </button>
            </div>

            {/* Opportunités d'Arbitrage */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3
                className="font-extrabold text-base text-[#16523A] mb-4"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Opportunités d&apos;Arbitrage
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Solaire + Stockage", delta: "+2.4% IRR", icon: "wb_sunny" },
                  { label: "ESCO B2B", delta: "+1.8% IRR", icon: "factory" },
                  { label: "Efficacité industrielle", delta: "+3.1% IRR", icon: "precision_manufacturing" },
                ].map((opp) => (
                  <div
                    key={opp.label}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF7] border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#16523A] text-base">{opp.icon}</span>
                      <span className="text-sm font-medium text-slate-700">{opp.label}</span>
                    </div>
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
                      {opp.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
