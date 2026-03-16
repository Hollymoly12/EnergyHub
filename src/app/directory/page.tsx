import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DirectoryClient from "./DirectoryClient";

export const metadata = {
  title: "Annuaire des acteurs — EnergyHub",
  description: "Trouvez les acteurs de la transition énergétique belge.",
};

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, count, error } = await supabase
    .from("organizations")
    .select(`
      id, name, slug, actor_type, short_description, city, region,
      logo_url, tags, technologies, certifications,
      is_verified, subscription_plan, rating, reviews_count,
      profile_views, founded_year, team_size
    `, { count: "exact" })
    .order("rating", { ascending: false })
    .range(0, 23);


  const actors = data ?? [];
  const total = count ?? 0;

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="border-b border-primary/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-2xl">bolt</span>
              <span className="text-xl font-extrabold tracking-tight font-display">EnergyHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold hover:text-primary transition-colors text-slate-600">Marketplace</Link>
              <Link href="/directory" className="text-sm font-bold text-primary border-b-2 border-primary pb-px">Annuaire</Link>
              <Link href="/rfq" className="text-sm font-semibold hover:text-primary transition-colors text-slate-600">Projets</Link>
              <Link href="/investment" className="text-sm font-semibold hover:text-primary transition-colors text-slate-600">Investissements</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                Mon Compte
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Connexion</Link>
                <Link href="/register" className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                  Rejoindre
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page heading */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-extrabold text-primary mb-4 leading-tight font-display">
              Annuaire des acteurs
            </h1>
            <p className="text-lg text-slate-600">
              Trouvez et collaborez avec les partenaires idéaux pour vos projets de transition énergétique en Belgique.
            </p>
          </div>
          <Link
            href={user ? "/dashboard/profile" : "/register"}
            className="inline-flex items-center gap-2 bg-accent text-primary px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add_circle</span>
            {user ? "Mon profil" : "Ajouter mon entreprise"}
          </Link>
        </div>

<DirectoryClient
          initialActors={actors || []}
          totalCount={total || 0}
          isLoggedIn={!!user}
        />
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white py-20 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-accent mb-6">
              <span className="material-symbols-outlined text-3xl">bolt</span>
              <h2 className="text-2xl font-extrabold tracking-tight font-display">EnergyHub</h2>
            </div>
            <p className="text-white/60 max-w-sm mb-8 text-sm leading-relaxed">
              La plateforme B2B de référence pour accélérer la transition énergétique en Belgique.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-6 uppercase tracking-widest text-accent/80">Plateforme</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li><Link href="/directory" className="hover:text-accent transition-colors">Annuaire</Link></li>
              <li><Link href="/rfq" className="hover:text-accent transition-colors">Appels d&apos;offres</Link></li>
              <li><Link href="/investment" className="hover:text-accent transition-colors">Investissement</Link></li>
              <li><Link href="/pricing" className="hover:text-accent transition-colors">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-6 uppercase tracking-widest text-accent/80">Légal</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li><a href="#" className="hover:text-accent transition-colors">Mentions légales</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">CGV / CGU</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 mt-10 border-t border-white/10 text-sm text-white/40 text-center">
          © {new Date().getFullYear()} EnergyHub. Tous droits réservés. Made for the Belgian Energy Ecosystem.
        </div>
      </footer>
    </div>
  );
}
