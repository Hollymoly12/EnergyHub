// src/app/api/deal-interests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let body: { dealId?: string; message?: string; ndaSigned?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { dealId, ndaSigned } = body;
    if (!dealId) return NextResponse.json({ error: "dealId is required" }, { status: 400 });
    if (typeof ndaSigned !== "boolean") {
      return NextResponse.json({ error: "ndaSigned must be a boolean" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    const orgId = member.organization_id as string;

    // Fetch deal to check requires_nda
    const { data: deal } = await supabase
      .from("deals")
      .select("id, requires_nda, organization_id, interests_count")
      .eq("id", dealId)
      .eq("status", "published")
      .single();
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    // Prevent self-interest
    if (deal.organization_id === orgId) {
      return NextResponse.json({ error: "Cannot express interest in your own deal" }, { status: 400 });
    }

    // NDA check
    if (deal.requires_nda && !ndaSigned) {
      return NextResponse.json({ error: "NDA signature is required for this deal" }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("deal_interests")
      .select("id")
      .eq("deal_id", dealId)
      .eq("investor_org_id", orgId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Already expressed interest in this deal" }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from("deal_interests").insert({
      deal_id: dealId,
      investor_org_id: orgId,
      expressed_by: user.id,
      nda_signed: ndaSigned,
      nda_signed_at: ndaSigned ? now : null,
      message: body.message?.trim() || null,
      status: "interested",
    });
    if (insertError) {
      console.error("deal_interests insert error:", insertError);
      return NextResponse.json({ error: "Failed to save interest" }, { status: 500 });
    }

    // Increment interests_count
    const { error: countError } = await supabase
      .from("deals")
      .update({ interests_count: (deal.interests_count ?? 0) + 1 })
      .eq("id", dealId);
    if (countError) {
      console.error("interests_count update error:", countError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/deal-interests error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
