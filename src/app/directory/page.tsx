import { createClient } from "@/lib/supabase/server";
import DirectoryClient from "./DirectoryClient";

export const metadata = {
  title: "Annuaire — EnergyHub",
  description: "Trouvez les acteurs de la transition énergétique belge.",
};

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch initial SSR (pour SEO)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/actors?limit=24&sort=rating`,
    { cache: "no-store" }
  );
  const { actors, total } = await res.json();

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">
            Annuaire
          </div>
          <h1 className="text-3xl font-bold text-white">
            Les acteurs de la transition énergétique
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {total} organisations référencées sur EnergyHub
          </p>
        </div>

        <DirectoryClient
          initialActors={actors || []}
          totalCount={total || 0}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
