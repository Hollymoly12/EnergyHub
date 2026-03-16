// src/app/dashboard/billing/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BillingPortalButton from "./BillingPortalButton";

const PLAN_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  free: {
    label: "Starter",
    color: "text-slate-500 border-slate-200 bg-slate-100",
    description: "Plan gratuit — 1 RFQ par mois, accès annuaire",
  },
  pro: {
    label: "Pro",
    color: "bg-accent/20 text-primary border-accent/30",
    description: "RFQ illimités, matching IA, analytics, module investissement",
  },
  enterprise: {
    label: "Enterprise",
    color: "text-purple-600 border-purple-200 bg-purple-50",
    description: "Tout le plan Pro + multi-sièges, API, support dédié",
  },
};

export const metadata = {
  title: "Abonnement — EnergyHub",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organizations(subscription_plan, stripe_customer_id, name)")
    .eq("id", user.id)
    .single();

  if (!member) redirect("/dashboard");

  const org = member.organizations as unknown as {
    subscription_plan: string;
    stripe_customer_id: string | null;
    name: string;
  } | null;

  const plan = org?.subscription_plan || "free";
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const hasStripe = !!org?.stripe_customer_id;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-2">Abonnement</p>
        <h1 className="text-2xl font-bold text-primary font-display">Gérer mon abonnement</h1>
      </div>

      {/* Success banner */}
      {success === "1" && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Abonnement activé avec succès ! Bienvenue sur le plan Pro.
        </div>
      )}

      {/* Plan actuel */}
      <div className="bg-white rounded-3xl p-6 mb-6 border border-black/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4">Plan actuel</h2>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${planCfg.color}`}>
            {planCfg.label}
          </span>
          <p className="text-slate-500 text-sm">{planCfg.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-3xl p-6 border border-black/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary/50 mb-4">Actions</h2>

        {plan === "free" ? (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">
              Passez au plan Pro pour accéder à toutes les fonctionnalités d&apos;EnergyHub.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#16523A" }}
            >
              <span className="material-symbols-outlined text-base">upgrade</span>
              Voir les tarifs
            </Link>
          </div>
        ) : hasStripe ? (
          <div className="space-y-4">
            <p className="text-slate-500 text-sm">
              Gérez votre abonnement, vos factures et vos informations de paiement via le portail Stripe.
            </p>
            <BillingPortalButton />
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Aucun abonnement Stripe actif trouvé. Contactez le support si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
        )}
      </div>
    </div>
  );
}
