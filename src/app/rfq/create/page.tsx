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

  const org = member?.organizations as unknown as { subscription_plan: string } | null;
  if (!org || org.subscription_plan === "free") {
    redirect("/pricing?reason=pro_required");
  }

  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest text-yellow-500 uppercase mb-2">
            Appels d'offres
          </div>
          <h1 className="text-3xl font-bold text-white">Publier un appel d'offres</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Rédigez votre RFQ et recevez des propositions qualifiées grâce au matching IA.
          </p>
        </div>
        <RFQCreateForm />
      </div>
    </div>
  );
}
