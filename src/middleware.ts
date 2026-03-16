// src/middleware.ts
// Protection des routes et refresh automatique du token Supabase

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui nécessitent d'être connecté
const PROTECTED_ROUTES = ["/dashboard", "/rfq/create", "/investment/submit", "/profile"];
// Routes réservées aux plans payants
const PRO_ROUTES = ["/rfq/create", "/rfq/respond", "/investment/submit", "/analytics"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Rediriger vers login si route protégée et non connecté
  if (PROTECTED_ROUTES.some((r) => path.startsWith(r)) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Rediriger vers upgrade si route Pro et plan Free
  if (PRO_ROUTES.some((r) => path.startsWith(r)) && user) {
    const { data: member } = await supabase
      .from("members")
      .select("organizations(subscription_plan)")
      .eq("id", user.id)
      .single();

    const rawOrg = member?.organizations;
    const orgPlan = Array.isArray(rawOrg)
      ? (rawOrg[0] as { subscription_plan: string } | undefined)?.subscription_plan
      : (rawOrg as unknown as { subscription_plan: string } | null)?.subscription_plan;
    if (!["pro", "enterprise"].includes(orgPlan ?? "")) {
      const upgradeUrl = new URL("/pricing", request.url);
      upgradeUrl.searchParams.set("reason", "pro_required");
      return NextResponse.redirect(upgradeUrl);
    }
  }

  // Rediriger vers dashboard si déjà connecté et accède à login/register
  if ((path === "/login" || path === "/register") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
