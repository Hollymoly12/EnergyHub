import { createClient } from "@/lib/supabase/server";
import RFQClient from "./RFQClient";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata = {
  title: "Appels d'offres — EnergyHub",
  description: "Parcourez les appels d'offres de la transition énergétique belge.",
};

export default async function RFQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/rfq?limit=20&page=0`,
    { cache: "no-store" }
  );
  const { rfqs, total } = res.ok ? await res.json() : { rfqs: [], total: 0 };

  return (
    <div className="min-h-screen bg-background-light">
      <PublicNavbar activePath="/projets" isLoggedIn={!!user} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2">Appels d'offres</p>
          <h1 className="text-4xl font-extrabold text-primary font-display leading-tight">
            Trouvez des projets à répondre
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {total || 0} appel{(total || 0) > 1 ? "s" : ""} d'offres publié{(total || 0) > 1 ? "s" : ""} sur EnergyHub
          </p>
        </div>

        <RFQClient
          initialRFQs={rfqs || []}
          totalCount={total || 0}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
