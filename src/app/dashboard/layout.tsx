import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard",            icon: "⊞",  label: "Vue d'ensemble" },
  { href: "/dashboard/profile",    icon: "◎",  label: "Mon profil" },
  { href: "/dashboard/rfq",        icon: "≡",  label: "Mes RFQ" },
  { href: "/dashboard/matches",    icon: "◈",  label: "Mes matchs" },
  { href: "/dashboard/messages",   icon: "◻",  label: "Messages" },
  { href: "/dashboard/investment", icon: "◆",  label: "Investissement" },
  { href: "/dashboard/billing",    icon: "◇",  label: "Abonnement" },
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

  const planLabel = org?.subscription_plan === "pro" ? "Pro" :
                    org?.subscription_plan === "enterprise" ? "Enterprise" : "Starter";
  const planColor = org?.subscription_plan === "pro" ? "text-brand-amber" :
                    org?.subscription_plan === "enterprise" ? "text-brand-purple" : "text-slate-500";

  return (
    <div className="flex h-screen bg-surface-DEFAULT overflow-hidden" style={{ backgroundColor: "#07090F" }}>

      {/* ── Sidebar ── */}
      <aside className="w-56 flex flex-col shrink-0" style={{ borderRight: "1px solid #1E2D45", backgroundColor: "#0D1421" }}>

        {/* Logo */}
        <div className="h-14 flex items-center px-4" style={{ borderBottom: "1px solid #1E2D45" }}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000" }}>
              ⚡
            </div>
            <span className="font-display font-bold text-sm text-white tracking-tight">EnergyHub</span>
          </Link>
        </div>

        {/* Org badge */}
        <div className="px-3 py-3" style={{ borderBottom: "1px solid #1E2D45" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: "#131C2E" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 overflow-hidden"
              style={{ backgroundColor: "#1A2540", border: "1px solid #243050" }}>
              {org?.logo_url
                ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                : <span style={{ color: "#F59E0B" }}>⬡</span>
              }
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate font-display">
                {org?.name || "Mon organisation"}
              </div>
              <div className={`text-[10px] font-bold tracking-widest mt-0.5 ${planColor}`} style={{ fontFamily: "Space Mono, monospace" }}>
                {planLabel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-px">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 transition-all duration-150 group"
              style={{ fontFamily: "DM Sans, sans-serif" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#131C2E";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#94A3B8";
              }}
            >
              <span className="text-base w-4 text-center shrink-0 opacity-70" style={{ fontFamily: "monospace" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Upgrade nudge */}
        {(!org?.subscription_plan || org.subscription_plan === "free") && (
          <div className="px-3 py-3" style={{ borderTop: "1px solid #1E2D45" }}>
            <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="text-xs font-bold text-yellow-500 mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Passer au Pro</div>
              <div className="text-xs mb-2.5" style={{ color: "#64748B" }}>RFQ illimités · Matching IA · Analytics</div>
              <Link href="/pricing" className="btn-primary text-xs py-1.5 px-3 w-full block text-center">
                Voir les offres →
              </Link>
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-3 py-3 flex items-center gap-2.5" style={{ borderTop: "1px solid #1E2D45" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: "#1A2540", border: "1px solid #243050", color: "#94A3B8" }}>
            {member?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-300 truncate">
              {member?.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : user.email?.split("@")[0]}
            </div>
            <div className="text-[10px] truncate" style={{ color: "#4A5568" }}>{user.email}</div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#07090F" }}>
        {children}
      </main>
    </div>
  );
}
