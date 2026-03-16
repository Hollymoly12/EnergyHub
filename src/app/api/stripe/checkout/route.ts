// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, createCheckoutSession, PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id, organizations(name, stripe_customer_id, subscription_plan)")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const org = member.organizations as unknown as {
      name: string;
      stripe_customer_id: string | null;
      subscription_plan: string;
    };
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const orgId = member.organization_id as string;

    if (org.subscription_plan !== "free") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    const body = await req.json();
    const { plan } = body;
    if (plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = PLANS.pro.priceId;
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const customerId = await getOrCreateStripeCustomer({
      organizationId: orgId,
      orgName: org.name,
      email: user.email,
      existingCustomerId: org.stripe_customer_id || undefined,
    });

    if (!org.stripe_customer_id) {
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);
      if (updateError) {
        console.error("Failed to persist stripe_customer_id:", updateError);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "App URL not configured" }, { status: 500 });
    }
    const url = await createCheckoutSession({
      customerId,
      priceId,
      organizationId: orgId,
      successUrl: `${appUrl}/dashboard/billing?success=1`,
      cancelUrl: `${appUrl}/pricing`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
