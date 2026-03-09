// src/app/api/profile/route.ts
// PATCH — Mise à jour du profil organisation + recalcul du score de complétion

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "name", "short_description", "description",
  "logo_url", "cover_image_url",
  "country", "region", "city", "address",
  "website", "phone", "linkedin_url",
  "technologies", "tags", "certifications",
  "founded_year", "team_size", "annual_revenue",
  "pitch_deck_url",
];

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("organization_id, organizations(is_org_admin)")
    .eq("id", user.id)
    .single();

  if (!member?.organization_id) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }

  const body = await req.json();

  // Whitelister les champs autorisés
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide fourni" }, { status: 400 });
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", member.organization_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculer le score de complétion via la fonction SQL
  const { data: newScore } = await supabase
    .rpc("calculate_profile_completion", { org_id: member.organization_id });

  if (newScore !== null) {
    await supabase
      .from("organizations")
      .update({ profile_completion: newScore })
      .eq("id", member.organization_id);
  }

  return NextResponse.json({
    org: { ...org, profile_completion: newScore ?? org.profile_completion },
  });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json({ member, org: member.organizations });
}
