import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const SIDEBAR_LINKS = [
  { href: "/dashboard",             icon: "⊞",  label: "Vue d'ensemble" },
  { href: "/dashboard/profile",     icon: "◎",  label: "Mon profil" },
  { href: "/dashboard/rfq",         icon: "📋", label: "Mes RFQ" },
  { href: "/dashboard/matches",     icon: "🧠", label: "Mes matchs" },
  { href: "/dashboard/messages",    icon: "✉️",  label: "Messages" },
  { href: "/dashboard/investment",  icon: "📈", label: "Investissement" },
  { href: "/dashboard/analytics",   icon: "📊", label: "Analytics" },
  { href: "/dashboard/billing",     icon: "💳", label: "Abonnement" },
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
    name: string; logo_url: string; subscription_plan: string; actor_type: string;
  } | null;

  return (
    <div className="flex h-screen bg-surface-DEFAULT overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-60 border-r border-surface-3 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-surface-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-amber to-brand-red flex items-center justify-center text-xs">⚡</div>
            <span className="font-display font-bold text-sm">EnergyHub</span>
          </Link>
        </div>

        {/* Org badge */}
        <div className="px-4 py-4 border-b border-surface-3">
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
            <div className="w-8 h-8 rounded-md bg-brand-amber/20 flex items-center justify-center text-sm">
              {org?.logo_url ? (
                <img src={org.logo_url} alt="" className="w-full h-full rounded-md object-cover" />
              ) : "🏢"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{org?.name || "Mon organisation"}</div>
              <div className={`text-[10px] font-bold tracking-wide mt-0.5 ${
                org?.subscription_plan === "pro" ? "text-brand-amber" :
                org?.subscription_plan === "enterprise" ? "text-brand-purple" : "text-slate-500"
              }`}>
                {org?.subscription_plan?.toUpperCase() || "FREE"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {SIDEBAR_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-2 transition-all group"
            >
              <span className="text-base leading-none">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        {/* Upgrade nudge si Free */}
        {org?.subscription_plan === "free" && (
          <div className="p-4 border-t border-surface-3">
            <div className="bg-brand-amber/8 border border-brand-amber/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-brand-amber mb-1">Passer au Pro</div>
              <div className="text-xs text-slate-500 mb-3">RFQ illimités, réponses, analytics</div>
              <Link href="/pricing" className="btn-primary text-xs py-1.5 px-3 block text-center">
                Voir les offres →
              </Link>
            </div>
          </div>
        )}

        {/* User */}
        <div className="px-4 py-3 border-t border-surface-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-xs text-slate-400">
            {member?.first_name?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">{member?.first_name} {member?.last_name}</div>
            <div className="text-[10px] text-slate-600 truncate">{user.email}</div>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
