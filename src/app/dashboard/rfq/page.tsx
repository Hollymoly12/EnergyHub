import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RFQDashboardClient from "./RFQDashboardClient";

export default async function DashboardRFQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/login");

  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, title, type, description, budget_range, deadline, location, status, views_count, responses_count, ai_summary, ai_matched_at, published_at, created_at, tags, target_actor_types")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mes appels d'offres</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rfqs?.length ?? 0} RFQ{(rfqs?.length ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/rfq/create" className="btn-primary">
          + Publier un RFQ
        </Link>
      </div>

      <RFQDashboardClient rfqs={rfqs ?? []} />
    </div>
  );
}
