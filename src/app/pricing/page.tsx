// src/app/pricing/page.tsx
import { createClient } from "@/lib/supabase/server";
import PricingClient from "./PricingClient";

export const metadata = {
  title: "Tarifs — EnergyHub",
  description: "Choisissez le plan adapté à votre organisation sur EnergyHub.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentPlan: string | null = null;
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("organizations(subscription_plan)")
      .eq("id", user.id)
      .single();
    const org = member?.organizations as unknown as { subscription_plan: string } | null;
    currentPlan = org?.subscription_plan || "free";
  }

  return (
    <div className="min-h-screen bg-background-light">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase text-primary/50 mb-3">Tarifs</p>
          <h1 className="text-5xl font-extrabold text-primary mb-4 font-display leading-tight">
            Choisissez votre plan
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Accédez aux outils de la marketplace B2B de la transition énergétique belge.
            Sans engagement, résiliable à tout moment.
          </p>
        </div>

        {/* Plan cards rendered by Client Component */}
        <PricingClient currentPlan={currentPlan} isLoggedIn={!!user} />

        {/* Trust signals */}
        <div className="mt-16 flex items-center justify-center gap-8 text-slate-400 text-sm flex-wrap">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary/50">lock</span>
            Paiement sécurisé Stripe
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary/50">receipt_long</span>
            Facturation mensuelle
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary/50">close</span>
            Sans engagement
          </span>
        </div>
      </div>
    </div>
  );
}
