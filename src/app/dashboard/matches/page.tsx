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

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mes matchs IA</h1>
          <p className="text-slate-500 text-sm mt-1">
            {allMatches.length} correspondance{allMatches.length > 1 ? "s" : ""} trouvée{allMatches.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <MatchesClient matches={allMatches} />
    </div>
  );
}
