// src/app/api/actors/route.ts
// Annuaire des acteurs avec recherche full-text et filtres

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("q") || "";
  const actorType = searchParams.get("type");
  const region = searchParams.get("region");
  const certification = searchParams.get("certification");
  const plan = searchParams.get("plan");
  const verified = searchParams.get("verified") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 100);
  const page = parseInt(searchParams.get("page") || "0");
  const sortBy = searchParams.get("sort") || "rating";

  let query = supabase
    .from("organizations")
    .select(`
      id, name, slug, actor_type, short_description, city, region,
      logo_url, tags, technologies, certifications,
      is_verified, subscription_plan, rating, reviews_count,
      profile_views, founded_year, team_size
    `, { count: "exact" });

  // Recherche full-text
  if (search) {
    query = query.textSearch("name", search, {
      type: "websearch",
      config: "french",
    });
  }

  // Filtres
  if (actorType) query = query.eq("actor_type", actorType);
  if (region) query = query.eq("region", region);
  if (verified) query = query.eq("is_verified", true);
  if (plan) query = query.eq("subscription_plan", plan);
  if (certification) query = query.contains("certifications", [certification]);

  // Tri
  if (sortBy === "recent") {
    query = query.order("created_at", { ascending: false });
  } else if (sortBy === "views") {
    query = query.order("profile_views", { ascending: false });
  } else {
    query = query.order("rating", { ascending: false });
  }

  query = query.range(page * limit, (page + 1) * limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Incrémenter les vues en arrière-plan (non-bloquant)
  // (en production, utiliser un système de queue)

  return NextResponse.json({
    actors: data,
    total: count,
    page,
    limit,
    has_more: (count || 0) > (page + 1) * limit,
  });
}
