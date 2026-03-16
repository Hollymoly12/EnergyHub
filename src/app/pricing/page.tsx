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
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#16523A" }}>Tarifs</div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#0D0D0D" }}>
            Choisissez votre plan
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Accédez aux outils de la marketplace B2B de la transition énergétique belge.
            Sans engagement, résiliable à tout moment.
          </p>
        </div>

        {/* Plan cards rendered by Client Component */}
        <PricingClient currentPlan={currentPlan} isLoggedIn={!!user} />

        {/* Trust signals */}
        <div className="mt-16 text-center text-slate-600 text-sm space-x-6">
          <span>🔒 Paiement sécurisé Stripe</span>
          <span>📄 Facturation mensuelle</span>
          <span>❌ Sans engagement</span>
        </div>
      </div>
    </div>
  );
}
