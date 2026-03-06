// src/app/api/rfq/route.ts
// CRUD complet + orchestration automatique des agents

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orchestrateNewRFQ } from "@/lib/claude/agents";

// GET — Lister les RFQ (avec filtres)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from("rfqs")
    .select(`
      *,
      organizations (id, name, logo_url, actor_type, city, is_verified, subscription_plan)
    `)
    .neq("status", "draft")
    .order("published_at", { ascending: false });

  // Filtres
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const actorType = searchParams.get("actor_type");
  const search = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "0");

  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  if (search) {
    query = query.textSearch("title", search, { type: "websearch", config: "french" });
  }

  query = query.range(page * limit, (page + 1) * limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rfqs: data, total: count, page, limit });
}

// POST — Créer un RFQ
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Vérifier le plan (Free limité à 1 RFQ/mois)
  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(subscription_plan)")
    .eq("id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const org = member.organizations as unknown as { subscription_plan: string };
  if (org?.subscription_plan === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("rfqs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", member.organization_id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count || 0) >= 1) {
      return NextResponse.json({
        error: "Limite du plan Starter atteinte. Passez au plan Pro pour des RFQ illimités.",
        upgrade_required: true,
      }, { status: 403 });
    }
  }

  const body = await req.json();

  const { data: rfq, error } = await supabase
    .from("rfqs")
    .insert({
      organization_id: member.organization_id,
      created_by: user.id,
      type: body.type || "rfq",
      title: body.title,
      description: body.description,
      requirements: body.requirements,
      budget_range: body.budget_range,
      deadline: body.deadline,
      location: body.location,
      target_actor_types: body.target_actor_types || [],
      target_technologies: body.target_technologies || [],
      target_regions: body.target_regions || [],
      tags: body.tags || [],
      status: body.publish ? "published" : "draft",
      published_at: body.publish ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 🤖 Orchestration automatique des agents si publié
  if (body.publish && rfq) {
    // Lancer en arrière-plan (non-bloquant)
    orchestrateNewRFQ(rfq.id).catch(console.error);
  }

  return NextResponse.json({ rfq }, { status: 201 });
}
