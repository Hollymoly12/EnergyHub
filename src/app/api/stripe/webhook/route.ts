// src/app/api/stripe/webhook/route.ts
// Gère tous les événements Stripe : paiements, abonnements, annulations

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    // Abonnement créé ou mis à jour
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata.organization_id;
      if (!orgId) break;

      const priceId = sub.items.data[0]?.price.id;
      const { PLANS } = await import("@/lib/stripe");

      let plan = "free";
      if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) plan = "pro";
      if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) plan = "enterprise";

      await supabase.from("organizations").update({
        subscription_plan: plan,
        stripe_subscription_id: sub.id,
        subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq("id", orgId);

      console.log(`✅ Org ${orgId} upgraded to ${plan}`);
      break;
    }

    // Abonnement annulé
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata.organization_id;
      if (!orgId) break;

      await supabase.from("organizations").update({
        subscription_plan: "free",
        stripe_subscription_id: null,
        subscription_expires_at: null,
      }).eq("id", orgId);

      console.log(`⚠️ Org ${orgId} downgraded to free`);
      break;
    }

    // Paiement réussi
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`💰 Payment succeeded: ${invoice.id}`);
      break;
    }

    // Paiement échoué
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Trouver l'org et notifier
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (org) {
        // Trouver l'admin de l'org et lui envoyer une notification
        const { data: admin } = await supabase
          .from("members")
          .select("id")
          .eq("organization_id", org.id)
          .eq("is_org_admin", true)
          .single();

        if (admin) {
          await supabase.from("notifications").insert({
            member_id: admin.id,
            type: "payment_failed",
            title: "Problème de paiement",
            message: "Votre dernier paiement a échoué. Veuillez mettre à jour vos informations de paiement.",
            link: "/dashboard/billing",
          });
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Désactiver le body parsing pour Stripe
export const config = {
  api: { bodyParser: false },
};
