// src/app/api/agents/matching/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMatchingAgent } from "@/lib/claude/agents";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Récupérer l'org de l'user avec toutes ses données
    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(*)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const sourceOrg = member.organizations as Record<string, unknown>;
    const sourceOrgId = member.organization_id as string;

    // Fetch candidats : toutes les orgs sauf la sienne (limit 20)
    const { data: candidates } = await supabase
      .from("organizations")
      .select("*")
      .neq("id", sourceOrgId)
      .limit(20);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: true, matchesCreated: 0 });
    }

    // Déclencher l'agent matching (sauvegarde les matchs ≥60 en BDD)
    const result = await runMatchingAgent({
      sourceOrgId,
      sourceOrgData: sourceOrg,
      candidateOrgs: candidates,
      context: "networking",
    });

    const matchesCreated = result.output?.matches?.length ?? 0;
    return NextResponse.json({ success: true, matchesCreated });
  } catch (error) {
    console.error("Matching agent error:", error);
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}
