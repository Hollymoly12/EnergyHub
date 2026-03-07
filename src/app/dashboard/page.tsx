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

  // Stats rapides
  const { count: rfqCount } = await supabase
    .from("rfqs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", org?.id as string);

  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("source_org_id", org?.id as string);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", user!.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Bonjour, {member?.first_name} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Voici ce qui se passe sur votre espace EnergyHub.
        </p>
      </div>

      {/* Profile completion alert */}
      {profileCompletion < 80 && (
        <div className="card p-5 mb-6 border-brand-amber/30 bg-brand-amber/4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-white">Complétez votre profil</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Un profil complet génère 3× plus de contacts
              </div>
            </div>
            <span className="text-brand-amber font-bold text-lg">{profileCompletion}%</span>
          </div>
          <div className="w-full bg-surface-3 rounded-full h-1.5 mb-3">
            <div
              className="bg-brand-amber h-1.5 rounded-full transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <Link href="/dashboard/profile" className="text-xs text-brand-amber hover:underline">
            Compléter mon profil →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "RFQ publiés", value: rfqCount || 0, icon: "📋", color: "text-brand-blue", link: "/dashboard/rfq" },
          { label: "Matchs IA", value: matchCount || 0, icon: "🧠", color: "text-brand-purple", link: "/dashboard/matches" },
          { label: "Vues profil", value: org?.profile_views || 0, icon: "👁", color: "text-brand-green", link: "/dashboard/analytics" },
          { label: "Plan actuel", value: plan.toUpperCase(), icon: "💳", color: "text-brand-amber", link: "/dashboard/billing" },
        ].map((k) => (
          <Link key={k.label} href={k.link} className="card p-5 hover:border-surface-4 transition-colors group">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{k.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/rfq/create" className="card p-5 hover:border-brand-amber/30 hover:bg-brand-amber/3 transition-all group">
          <div className="text-2xl mb-3">📋</div>
          <div className="font-semibold text-white text-sm mb-1 group-hover:text-brand-amber transition-colors">
            Publier un RFI / RFQ
          </div>
          <div className="text-xs text-slate-500">Lancez un appel d'offres ciblé</div>
        </Link>
        <Link href="/directory" className="card p-5 hover:border-brand-purple/30 hover:bg-brand-purple/3 transition-all group">
          <div className="text-2xl mb-3">🔍</div>
          <div className="font-semibold text-white text-sm mb-1 group-hover:text-brand-purple transition-colors">
            Parcourir l'annuaire
          </div>
          <div className="text-xs text-slate-500">Trouvez le bon partenaire</div>
        </Link>
        <Link href="/investment/submit" className="card p-5 hover:border-brand-green/30 hover:bg-brand-green/3 transition-all group">
          <div className="text-2xl mb-3">📈</div>
          <div className="font-semibold text-white text-sm mb-1 group-hover:text-brand-green transition-colors">
            Soumettre un projet
          </div>
          <div className="text-xs text-slate-500">Trouvez des investisseurs</div>
        </Link>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-surface-3">
          <h2 className="font-semibold text-white text-sm">Notifications récentes</h2>
          {(notifications?.length || 0) > 0 && (
            <span className="badge bg-brand-amber/20 text-brand-amber">{notifications?.length} nouvelles</span>
          )}
        </div>
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-surface-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-surface-3/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-brand-amber mt-1.5 shrink-0" />
                <div>
                  <div className="text-sm text-white font-medium">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-600 text-sm">
            Aucune nouvelle notification
          </div>
        )}
      </div>
    </div>
  );
}
