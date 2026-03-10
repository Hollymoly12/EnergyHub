"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRFQStatus(rfqId: string, newStatus: "published" | "closed") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Vérifier ownership
  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("rfqs")
    .update({
      status: newStatus,
      ...(newStatus === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", rfqId)
    .eq("organization_id", member.organization_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rfq");
}

export async function deleteRFQ(rfqId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("rfqs")
    .delete()
    .eq("id", rfqId)
    .eq("organization_id", member.organization_id)
    .eq("status", "draft");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rfq");
}
