import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Tableau de bord",   icon: "dashboard" },
  { href: "/dashboard/rfq",        label: "Mes Projets / RFQ", icon: "folder_open" },
  { href: "/dashboard/messages",   label: "Messages",          icon: "chat_bubble" },
  { href: "/dashboard/rfq",        label: "Appels d'offres",   icon: "assignment" },
  { href: "/directory",            label: "Annuaire",          icon: "menu_book" },
  { href: "/dashboard/matches",    label: "Matching IA",       icon: "psychology" },
  { href: "/dashboard/investment", label: "Investissement",    icon: "trending_up" },
  { href: "/dashboard/billing",    label: "Abonnement",        icon: "receipt_long" },
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

  const displayName = member?.first_name
    ? `${member.first_name} ${member.last_name || ""}`.trim()
    : user.email?.split("@")[0] || "Utilisateur";

  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-primary text-white fixed h-full flex flex-col z-20">

        {/* Logo section */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="size-10 bg-accent rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined font-bold">bolt</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight m-0">EnergyHub</h1>
              <p className="text-accent/80 text-xs uppercase tracking-wider m-0">Solutions Énergétiques</p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={`${item.href}-${item.icon}`}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white no-underline"
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/10 space-y-3">

          {/* Settings */}
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white no-underline"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-medium">Paramètres</span>
          </Link>

          {/* Upgrade card */}
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-accent mb-1">Support Premium</p>
            <p className="text-xs text-white/60 mb-3 leading-relaxed">Accédez à notre équipe d&apos;experts en transition énergétique.</p>
            <Link
              href="/pricing"
              className="block text-center bg-accent text-primary font-bold rounded-lg py-2 text-xs no-underline hover:opacity-90 transition-opacity"
            >
              Contacter un Expert
            </Link>
          </div>

          {/* User section */}
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-white/10">
            <div className="size-9 bg-accent/20 border border-accent/30 rounded-full flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate m-0">{displayName}</p>
              <p className="text-xs text-white/50 truncate m-0">{user.email}</p>
            </div>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                title="Se déconnecter"
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 ml-72 overflow-y-auto bg-background-light min-h-screen">

        {/* Top header bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-700 transition-colors no-underline">Accueil</Link>
            <span className="material-symbols-outlined text-base text-slate-400">chevron_right</span>
            <span className="text-slate-900 font-medium">Dashboard</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">{displayName}</span>
              <div className="size-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
