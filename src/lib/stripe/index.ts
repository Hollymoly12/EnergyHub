// src/lib/stripe/index.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Starter",
    priceId: null,
    price: 0,
    features: {
      maxRfqPerMonth: 1,
      canViewDirectory: true,
      canRespond: false,
      canAccessInvestment: false,
      profileBoost: false,
      analytics: false,
    },
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    price: 149,
    features: {
      maxRfqPerMonth: -1, // illimité
      canViewDirectory: true,
      canRespond: true,
      canAccessInvestment: true,
      profileBoost: true,
      analytics: true,
    },
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    price: 499, // base, ajustable
    features: {
      maxRfqPerMonth: -1,
      canViewDirectory: true,
      canRespond: true,
      canAccessInvestment: true,
      profileBoost: true,
      analytics: true,
      multiSeats: true,
      apiAccess: true,
      dedicatedSupport: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// Créer ou récupérer le customer Stripe pour une organisation
export async function getOrCreateStripeCustomer(params: {
  organizationId: string;
  orgName: string;
  email: string;
  existingCustomerId?: string;
}): Promise<string> {
  if (params.existingCustomerId) {
    return params.existingCustomerId;
  }

  const customer = await stripe.customers.create({
    name: params.orgName,
    email: params.email,
    metadata: {
      organization_id: params.organizationId,
    },
  });

  return customer.id;
}

// Créer une session de checkout Stripe
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organization_id: params.organizationId,
    },
    subscription_data: {
      metadata: {
        organization_id: params.organizationId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    locale: "fr",
  });

  return session.url!;
}

// Créer un portail de gestion de l'abonnement
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}
