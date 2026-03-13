// src/app/dashboard/billing/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BillingPortalButton from "./BillingPortalButton";

const PLAN_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  free: {
    label: "Starter",
    color: "text-slate-400 border-slate-700 bg-slate-800/50",
    description: "Plan gratuit — 1 RFQ par mois, accès annuaire",
  },
  pro: {
    label: "Pro",
    color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
    description: "RFQ illimités, matching IA, analytics, module investissement",
  },
  enterprise: {
    label: "Enterprise",
    color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
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
        <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">Abonnement</div>
        <h1 className="text-2xl font-bold text-white">Gérer mon abonnement</h1>
      </div>

      {/* Success banner */}
      {success === "1" && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Abonnement activé avec succès ! Bienvenue sur le plan Pro.
        </div>
      )}

      {/* Plan actuel */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Plan actuel</h2>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold border ${planCfg.color}`}>
            {planCfg.label}
          </span>
          <p className="text-slate-400 text-sm">{planCfg.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Actions</h2>

        {plan === "free" ? (
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">
              Passez au plan Pro pour accéder à toutes les fonctionnalités d&apos;EnergyHub.
            </p>
            <Link href="/pricing" className="btn-primary inline-block">
              Voir les tarifs →
            </Link>
          </div>
        ) : hasStripe ? (
          <div className="space-y-3">
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
