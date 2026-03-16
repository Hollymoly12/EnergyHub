import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchesClient from "./MatchesClient";

interface MatchWithOrg {
  id: string;
  match_score: number;
  match_reasons: string[];
  is_viewed: boolean;
  rfq_id: string | null;
  created_at: string;
  direction: "sent" | "received";
  matched_org: {
    id: string;
    name: string;
    slug: string;
    actor_type: string;
    logo_url: string | null;
    city: string | null;
    is_verified: boolean;
  };
  rfq_title?: string | null;
}

export default async function DashboardMatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/login");

  const orgId = member.organization_id;

  // Matchs initiés (source)
  const { data: sentMatches } = await supabase
    .from("matches")
    .select(`
      id, match_score, match_reasons, is_viewed, rfq_id, created_at,
      target_org:organizations!matches_target_org_id_fkey(id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("source_org_id", orgId)
    .order("match_score", { ascending: false });

  // Matchs reçus (target)
  const { data: receivedMatches } = await supabase
    .from("matches")
    .select(`
      id, match_score, match_reasons, is_viewed, rfq_id, created_at,
      source_org:organizations!matches_source_org_id_fkey(id, name, slug, actor_type, logo_url, city, is_verified)
    `)
    .eq("target_org_id", orgId)
    .order("match_score", { ascending: false });

  // Normaliser en un seul array
  const allMatches: MatchWithOrg[] = [
    ...(sentMatches || []).map((m) => ({
      id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons || [],
      is_viewed: m.is_viewed,
      rfq_id: m.rfq_id,
      created_at: m.created_at,
      direction: "sent" as const,
      matched_org: m.target_org as unknown as MatchWithOrg["matched_org"],
    })),
    ...(receivedMatches || []).map((m) => ({
      id: m.id,
      match_score: m.match_score,
      match_reasons: m.match_reasons || [],
      is_viewed: m.is_viewed,
      rfq_id: m.rfq_id,
      created_at: m.created_at,
      direction: "received" as const,
      matched_org: m.source_org as unknown as MatchWithOrg["matched_org"],
    })),
  ].sort((a, b) => b.match_score - a.match_score);

  const unreadCount = allMatches.filter((m) => !m.is_viewed).length;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-tag mb-3">Mes matchs</p>
          <h1 className="font-display text-3xl font-bold text-white leading-tight">
            Correspondances IA
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {allMatches.length} correspondance{allMatches.length !== 1 ? "s" : ""} trouvée{allMatches.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 badge-amber">{unreadCount} non vus</span>
            )}
          </p>
        </div>
      </div>

      {/* Summary stats row */}
      {allMatches.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total matchs",
              value: allMatches.length,
              color: "#F59E0B",
            },
            {
              label: "Score moyen",
              value: `${Math.round(allMatches.reduce((acc, m) => acc + m.match_score, 0) / allMatches.length)}%`,
              color: "#818CF8",
            },
            {
              label: "Non vus",
              value: unreadCount,
              color: unreadCount > 0 ? "#EF4444" : "#4A5568",
            },
          ].map((s) => (
            <div key={s.label} className="card p-4" style={{ borderColor: "var(--border)" }}>
              <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <MatchesClient matches={allMatches} />
    </div>
  );
}
