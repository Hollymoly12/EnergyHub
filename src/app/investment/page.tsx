// src/app/investment/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DealsClient from "./DealsClient";

export const metadata = {
  title: "Investissement — EnergyHub",
  description: "Découvrez les opportunités d'investissement dans la transition énergétique belge.",
};

export default async function InvestmentPage() {
  const supabase = await createClient();

  const { data: rawDeals } = await supabase
    .from("deals")
    .select(`
      id, title, description, project_type, funding_amount, funding_type,
      irr_target, published_at, interests_count,
      organizations (name, city)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  // Transform Supabase response: organizations is an array, take first element
  const deals = (rawDeals ?? []).map((deal: any) => ({
    ...deal,
    organizations: Array.isArray(deal.organizations) ? (deal.organizations[0] ?? null) : deal.organizations,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#16523A" }}>
              Investissement
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: "#0D0D0D" }}>
              Opportunités d&apos;investissement
            </h1>
            <p className="text-slate-400 max-w-xl">
              Découvrez les projets de la transition énergétique belge en recherche de financement.
            </p>
          </div>
          <Link href="/investment/submit" className="btn-primary whitespace-nowrap">
            Soumettre un deal +
          </Link>
        </div>

        <DealsClient deals={deals} />
      </div>
    </div>
  );
}
