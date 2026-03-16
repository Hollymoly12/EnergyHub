// src/app/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "./ProjectsClient";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata = {
  title: "Deals & Levées de Fonds — EnergyHub",
  description: "Projets en recherche de financement et opportunités d'investissement dans la transition énergétique belge.",
};

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
  ai_risk_score: number | null;
  status: string | null;
  capacity_mw: number | null;
  location: string | null;
  series: string | null;
  organizations: DealOrg | null;
}

export default async function InvestmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawDeals } = await supabase
    .from("deals")
    .select(`
      id, title, description, project_type, funding_amount, funding_type,
      irr_target, published_at, interests_count, ai_risk_score, status,
      capacity_mw, location, series,
      organizations (name, city)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const deals: Deal[] = ((rawDeals ?? []) as Record<string, unknown>[]).map((deal) => ({
    ...deal,
    organizations: Array.isArray(deal.organizations)
      ? (deal.organizations[0] ?? null)
      : (deal.organizations as DealOrg | null),
  })) as Deal[];

  return (
    <div className="min-h-screen bg-background-light font-sans">

      <PublicNavbar activePath="/investment" isLoggedIn={!!user} />

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Hero heading ── */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-3 font-display" style={{ color: "#16523A" }}>
            Deals & Levées de Fonds
          </h1>
          <p className="text-slate-500 text-base max-w-xl leading-relaxed">
            Explorez l&apos;écosystème de la transition énergétique belge. Trouvez des opportunités
            d&apos;investissement, suivez le progrès des infrastructures critiques et collaborez sur des
            projets d&apos;avenir.
          </p>
        </div>

        {/* Client: search + filters + grid + pagination */}
        <ProjectsClient deals={deals} />

      </div>

      {/* ── Footer ── */}
      <footer className="mt-20 py-12 px-6" style={{ backgroundColor: "#16523A" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-2xl" style={{ color: "#B8FF3C" }}>bolt</span>
                <span className="font-extrabold text-xl text-white">EnergyHub</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                La plateforme leader pour le financement et le développement des projets énergétiques durables en Belgique.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="material-symbols-outlined text-white/40 text-lg cursor-pointer hover:text-white/70 transition-colors">language</span>
                <span className="material-symbols-outlined text-white/40 text-lg cursor-pointer hover:text-white/70 transition-colors">share</span>
                <span className="material-symbols-outlined text-white/40 text-lg cursor-pointer hover:text-white/70 transition-colors">alternate_email</span>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#B8FF3C" }}>Navigation</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                {["Marketplace", "Annuaire Projets", "Entreprises", "Appels d'offres"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#B8FF3C" }}>Ressources</p>
              <ul className="space-y-2.5 text-sm text-white/60">
                {["Documentation API", "Guide Investisseur", "Rapports du Marché", "Blog & News"].map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#B8FF3C" }}>Newsletter</p>
              <p className="text-white/60 text-sm mb-4">Recevez les nouveaux projets directement dans votre boite mail.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-accent"
                />
                <button
                  className="size-10 rounded-xl flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#B8FF3C" }}
                >
                  <span className="material-symbols-outlined text-base" style={{ color: "#16523A" }}>arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
            <p>© 2024 EnergyHub Platform. Tous droits réservés.</p>
            <div className="flex items-center gap-5">
              {["Mentions Légales", "Confidentialité", "Cookies"].map((l) => (
                <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
