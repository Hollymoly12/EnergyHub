import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(stripe_customer_id)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const org = member.organizations as unknown as { stripe_customer_id: string | null };
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    if (!org.stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const url = await createBillingPortalSession(
      org.stripe_customer_id,
      `${appUrl}/dashboard/billing`
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
