import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Vue d'ensemble" },
  { href: "/dashboard/profile",    label: "Mon profil" },
  { href: "/dashboard/rfq",        label: "Mes RFQ" },
  { href: "/dashboard/matches",    label: "Mes matchs" },
  { href: "/dashboard/messages",   label: "Messages" },
  { href: "/dashboard/investment", label: "Investissement" },
  { href: "/dashboard/billing",    label: "Abonnement" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*, organizations(name, logo_url, subscription_plan, actor_type)")
    .eq("id", user.id)
    .single();

  const org = member?.organizations as unknown as {
    name: string;
    logo_url: string;
    subscription_plan: string;
    actor_type: string;
  } | null;

  const planLabel = org?.subscription_plan === "pro" ? "Pro"
    : org?.subscription_plan === "enterprise" ? "Enterprise"
    : "Starter";

  const planStyle = org?.subscription_plan === "pro"
    ? { backgroundColor: "#D4E8DF", color: "#16523A" }
    : org?.subscription_plan === "enterprise"
    ? { backgroundColor: "#EDE9FE", color: "#5B21B6" }
    : { backgroundColor: "#F3F1EC", color: "#6B6560" };

  const displayName = member?.first_name
    ? `${member.first_name} ${member.last_name || ""}`.trim()
    : user.email?.split("@")[0] || "Utilisateur";

  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#FAFAF7", overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 220, display: "flex", flexDirection: "column", flexShrink: 0, backgroundColor: "#F3F1EC", borderRight: "1px solid #E2DDD6" }}>

        {/* Logo */}
        <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #E2DDD6" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#16523A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1 8h5.5L5 13l8-8H7.5L9 1z" fill="#B8FF3C" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: 800, fontSize: 15, color: "#0D0D0D", letterSpacing: "-0.02em" }}>EnergyHub</span>
          </Link>
        </div>

        {/* Org badge */}
        <div style={{ padding: "12px 12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #E2DDD6" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#EAE7E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#16523A", flexShrink: 0, overflow: "hidden" }}>
              {org?.logo_url
                ? <img src={org.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (org?.name?.[0]?.toUpperCase() || "E")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0D0D0D", fontFamily: "Bricolage Grotesque, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {org?.name || "Mon organisation"}
              </div>
              <span style={{ ...planStyle, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "1px 7px", fontFamily: "Fira Code, monospace", letterSpacing: "0.05em", display: "inline-block", marginTop: 2 }}>
                {planLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", marginTop: 8 }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#3A3632", textDecoration: "none", fontFamily: "Plus Jakarta Sans, sans-serif", marginBottom: 1, transition: "background-color 0.15s, color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#EAE7E0"; (e.currentTarget as HTMLElement).style.color = "#0D0D0D"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#3A3632"; }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Upgrade nudge */}
        {(!org?.subscription_plan || org.subscription_plan === "free") && (
          <div style={{ padding: "12px", borderTop: "1px solid #E2DDD6" }}>
            <div style={{ backgroundColor: "#16523A", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B8FF3C", marginBottom: 4, fontFamily: "Bricolage Grotesque, sans-serif" }}>Passer au Pro</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.5 }}>RFQ illimités · Matching IA · Analytics</div>
              <Link href="/pricing" style={{ display: "block", textAlign: "center", backgroundColor: "#B8FF3C", color: "#0D3324", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 8, textDecoration: "none", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Voir les offres →
              </Link>
            </div>
          </div>
        )}

        {/* User */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E2DDD6", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#E2DDD6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#3A3632", flexShrink: 0, fontFamily: "Fira Code, monospace" }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0D0D0D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#B8B2AB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflowY: "auto", backgroundColor: "#FAFAF7" }}>
        {children}
      </main>
    </div>
  );
}
