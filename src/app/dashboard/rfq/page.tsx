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

  const publishedCount = rfqs?.filter(
    (r) => r.status === "published" || r.status === "responses_open" || r.status === "under_review"
  ).length ?? 0;

  const draftCount = rfqs?.filter((r) => r.status === "draft").length ?? 0;

  const totalResponses = rfqs?.reduce((acc, r) => acc + (r.responses_count ?? 0), 0) ?? 0;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-tag mb-3">Mes RFQ</p>
          <h1 className="font-display text-3xl font-bold text-white leading-tight">
            Appels d'offres
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {rfqs?.length ?? 0} RFQ{(rfqs?.length ?? 0) !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/rfq/create" className="btn-primary" style={{ alignSelf: "flex-start" }}>
          + Créer un RFQ
        </Link>
      </div>

      {/* Summary stats row */}
      {(rfqs?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4" style={{ borderColor: "var(--border)" }}>
            <div className="stat-number" style={{ color: "#22C55E" }}>{publishedCount}</div>
            <div className="text-xs text-slate-500 mt-1">Publiés / actifs</div>
          </div>
          <div className="card p-4" style={{ borderColor: "var(--border)" }}>
            <div className="stat-number" style={{ color: "#94A3B8" }}>{draftCount}</div>
            <div className="text-xs text-slate-500 mt-1">Brouillons</div>
          </div>
          <div className="card p-4" style={{ borderColor: "var(--border)" }}>
            <div className="stat-number" style={{ color: "#F59E0B" }}>{totalResponses}</div>
            <div className="text-xs text-slate-500 mt-1">Réponses reçues</div>
          </div>
        </div>
      )}

      <RFQDashboardClient rfqs={rfqs ?? []} />
    </div>
  );
}
