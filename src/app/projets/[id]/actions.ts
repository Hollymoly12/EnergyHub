"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitResponse(rfqId: string, formData: {
  message: string;
  price_range?: string;
  delivery_timeline?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Connectez-vous pour répondre à ce RFQ");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(subscription_plan)")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Membre introuvable");

  const org = member.organizations as unknown as { subscription_plan: string };
  const orgId = member.organization_id as string;

  // Valider message
  if (!formData.message || formData.message.trim().length < 50) {
    throw new Error("Le message doit contenir au moins 50 caractères");
  }

  // Vérifier que l'utilisateur ne répond pas à son propre RFQ
  const { data: rfq } = await supabase
    .from("rfqs")
    .select("organization_id")
    .eq("id", rfqId)
    .single();
  if (rfq?.organization_id === orgId) {
    throw new Error("Vous ne pouvez pas répondre à votre propre appel d'offres");
  }

  // Vérifier doublon
  const { count: existingCount } = await supabase
    .from("rfq_responses")
    .select("*", { count: "exact", head: true })
    .eq("rfq_id", rfqId)
    .eq("organization_id", orgId);

  if ((existingCount || 0) > 0) {
    throw new Error("Votre organisation a déjà répondu à cet appel d'offres");
  }

  // Vérifier limite Free (1 réponse/mois)
  if (org?.subscription_plan === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("rfq_responses")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("submitted_at", startOfMonth.toISOString());

    if ((count || 0) >= 1) {
      throw new Error("LIMIT_REACHED");
    }
  }

  const { error } = await supabase
    .from("rfq_responses")
    .insert({
      rfq_id: rfqId,
      organization_id: orgId,
      submitted_by: user.id,
      message: formData.message.trim(),
      price_range: formData.price_range?.trim() || null,
      delivery_timeline: formData.delivery_timeline?.trim() || null,
      status: "submitted",
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Votre organisation a déjà répondu à cet appel d'offres");
    }
    throw new Error(error.message);
  }
  revalidatePath(`/projets/${rfqId}`);
}
