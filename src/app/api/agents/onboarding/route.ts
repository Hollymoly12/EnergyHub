// src/app/api/agents/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runOnboardingAgent } from "@/lib/claude/agents";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = await runOnboardingAgent({
      organizationId: body.organizationId,
      memberId: user.id,
      actorType: body.actorType,
      profileData: body.profileData,
      currentStep: body.currentStep || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}
