import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("members")
    .select("*, organizations(*)")
    .eq("id", user!.id)
    .single();

  const org = member?.organizations as Record<string, unknown> | null;
  const plan = (org?.subscription_plan as string) || "free";
  const profileCompletion = (org?.profile_completion as number) || 0;
  const orgName = (org?.name as string) || member?.first_name || "vous";

  // Stats rapides
  const { count: rfqCount } = await supabase
    .from("rfqs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", org?.id as string);

  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("source_org_id", org?.id as string);

  const { count: unreadMsgCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("member_id", user!.id)
    .eq("is_read", false);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", user!.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const planBadgeClass =
    plan === "enterprise" ? "badge-purple" :
    plan === "pro" ? "badge-amber" :
    "badge-muted";

  const stats = [
    {
      label: "RFQs publiés",
      value: rfqCount ?? 0,
      sub: "appels d'offres",
      href: "/dashboard/rfq",
      color: "#818CF8",
    },
    {
      label: "Matchs reçus",
      value: matchCount ?? 0,
      sub: "correspondances IA",
      href: "/dashboard/matches",
      color: "#F59E0B",
    },
    {
      label: "Profil complété",
      value: `${profileCompletion}%`,
      sub: "score de visibilité",
      href: "/dashboard/profile",
      color: profileCompletion >= 80 ? "#22C55E" : "#F59E0B",
    },
    {
      label: "Messages",
      value: unreadMsgCount ?? 0,
      sub: "non lus",
      href: "/dashboard/messages",
      color: "#EF4444",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-tag mb-3">Vue d'ensemble</p>
          <h1 className="font-display text-3xl font-bold text-white leading-tight">
            Bonjour, {orgName}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Voici l'état de votre espace EnergyHub.
          </p>
        </div>
        <span className={planBadgeClass} style={{ alignSelf: "flex-start", marginTop: "4px" }}>
          {plan.toUpperCase()}
        </span>
      </div>

      {/* Profile completion alert */}
      {profileCompletion < 80 && (
        <div
          className="card p-5 mb-8"
          style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.04)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-white">Complétez votre profil</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Un profil complet génère 3× plus de contacts
              </div>
            </div>
            <span
              className="font-data text-xl font-bold"
              style={{ color: "#F59E0B" }}
            >
              {profileCompletion}%
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 mb-3" style={{ background: "#1A2540" }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${profileCompletion}%`, background: "#F59E0B" }}
            />
          </div>
          <Link href="/dashboard/profile" className="text-xs hover:underline" style={{ color: "#F59E0B" }}>
            Compléter mon profil →
          </Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card p-5 hover:shadow-lg transition-all group"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="stat-number mb-1 group-hover:opacity-90 transition-opacity"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="font-display text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Actions rapides
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/rfq/create"
          className="card p-6 flex flex-col gap-3 group transition-all"
          style={{ borderColor: "var(--border)" }}
          onMouseEnter={undefined}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            📋
          </div>
          <div>
            <div
              className="font-semibold text-sm text-white group-hover:text-yellow-400 transition-colors"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Publier un RFQ
            </div>
            <div className="text-xs text-slate-500 mt-1">Lancez un appel d'offres ciblé</div>
          </div>
          <span className="text-xs mt-auto" style={{ color: "#F59E0B" }}>Commencer →</span>
        </Link>

        <Link
          href="/dashboard/matches"
          className="card p-6 flex flex-col gap-3 group transition-all"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)" }}
          >
            🧠
          </div>
          <div>
            <div
              className="font-semibold text-sm text-white group-hover:text-purple-400 transition-colors"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Voir mes matchs
            </div>
            <div className="text-xs text-slate-500 mt-1">Correspondances IA calculées</div>
          </div>
          <span className="text-xs mt-auto" style={{ color: "#818CF8" }}>Explorer →</span>
        </Link>

        <Link
          href="/directory"
          className="card p-6 flex flex-col gap-3 group transition-all"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            🔍
          </div>
          <div>
            <div
              className="font-semibold text-sm text-white group-hover:text-green-400 transition-colors"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Explorer l'annuaire
            </div>
            <div className="text-xs text-slate-500 mt-1">Trouvez le bon partenaire</div>
          </div>
          <span className="text-xs mt-auto" style={{ color: "#22C55E" }}>Parcourir →</span>
        </Link>
      </div>

      {/* Recent activity — Notifications */}
      <div className="card" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid #1E2D45" }}
        >
          <h2
            className="font-semibold text-sm text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Activité récente
          </h2>
          {(notifications?.length || 0) > 0 && (
            <span className="badge-amber">{notifications?.length} nouvelles</span>
          )}
        </div>

        {notifications && notifications.length > 0 ? (
          <div>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-white/[0.02]"
                style={i < notifications.length - 1 ? { borderBottom: "1px solid #1E2D45" } : {}}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#F59E0B" }}
                />
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3 opacity-30">🔔</div>
            <p className="text-slate-600 text-sm">Aucune nouvelle notification</p>
          </div>
        )}
      </div>
    </div>
  );
}
