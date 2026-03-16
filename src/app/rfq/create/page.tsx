import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RFQCreateForm from "./RFQCreateForm";

export const metadata = {
  title: "Publier un RFQ — EnergyHub",
};

export default async function RFQCreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/rfq/create");

  const { data: member } = await supabase
    .from("members")
    .select("organizations(subscription_plan)")
    .eq("id", user.id)
    .single();

  const rawOrg = member?.organizations;
  const orgPlan = Array.isArray(rawOrg)
    ? (rawOrg[0] as { subscription_plan: string } | undefined)?.subscription_plan
    : (rawOrg as unknown as { subscription_plan: string } | null)?.subscription_plan;

  if (!["pro", "enterprise"].includes(orgPlan ?? "")) {
    redirect("/pricing?reason=pro_required");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF7" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#16523A" }}>
            Appels d'offres
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#0D0D0D" }}>Publier un appel d'offres</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Rédigez votre RFQ et recevez des propositions qualifiées grâce au matching IA.
          </p>
        </div>
        <RFQCreateForm />
      </div>
    </div>
  );
}
