// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeDeal } from "@/lib/claude/agents";

export async function POST(req: NextRequest) {
  try {
    // Parse body first
    let body: {
      title?: string;
      description?: string;
      funding_amount?: number;
      project_type?: string;
      location?: string;
      capacity_mw?: number;
      funding_type?: string;
      series?: string;
      irr_target?: number;
      duration_years?: number;
      current_investors?: string;
      pitch_deck_url?: string;
      financial_model_url?: string;
      requires_nda?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, description, funding_amount } = body;
    if (!title?.trim() || !description?.trim() || !funding_amount) {
      return NextResponse.json(
        { error: "title, description et funding_amount sont requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (!member.organizations) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const orgId = member.organization_id as string;
    const now = new Date().toISOString();

    const { data: deal, error: insertError } = await supabase
      .from("deals")
      .insert({
        organization_id: orgId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim(),
        funding_amount,
        project_type: body.project_type || null,
        location: body.location || null,
        capacity_mw: body.capacity_mw || null,
        funding_type: body.funding_type || null,
        series: body.series || null,
        irr_target: body.irr_target || null,
        duration_years: body.duration_years || null,
        current_investors: body.current_investors || null,
        pitch_deck_url: body.pitch_deck_url || null,
        financial_model_url: body.financial_model_url || null,
        requires_nda: body.requires_nda ?? true,
        status: "published",
        published_at: now,
      })
      .select("id")
      .single();

    if (insertError || !deal) {
      console.error("Deal insert error:", insertError);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }

    // Agent IA synchrone (bloquant ~3-5s, acceptable pour une soumission)
    // A failed analysis does NOT fail the deal creation — deal is saved regardless
    try {
      await analyzeDeal({
        id: deal.id,
        organizationId: orgId,
        title: title.trim(),
        description: description.trim(),
        projectType: body.project_type,
        location: body.location,
        capacityMw: body.capacity_mw,
        fundingAmount: funding_amount,
        fundingType: body.funding_type,
        series: body.series,
        irrTarget: body.irr_target,
        durationYears: body.duration_years,
      });
    } catch (aiError) {
      console.error("analyzeDeal failed (deal still created):", aiError);
    }

    return NextResponse.json({ id: deal.id, success: true });
  } catch (error) {
    console.error("POST /api/deals error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
