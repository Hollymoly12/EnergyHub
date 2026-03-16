import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  subscription_plan: string;
  profile_completion: number;
  actor_type: string;
}

interface Member {
  first_name: string | null;
  organizations: Organization | null;
}

interface Match {
  id: string;
  match_score: number;
  match_reasons: string[] | null;
  target_org: {
    id: string;
    name: string;
    slug: string;
    actor_type: string;
    logo_url: string | null;
    city: string | null;
  } | null;
}

interface Rfq {
  id: string;
  title: string;
  deadline: string | null;
  status: string;
}

const ACTOR_TYPE_LABELS: Record<string, string> = {
  industrial: "Industriel",
  installer: "Installateur",
  software_editor: "Éditeur logiciel",
  investor: "Investisseur",
  energy_provider: "Fournisseur énergie",
  esco: "ESCO",
  greentech: "Greentech",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("members")
    .select("first_name, organizations(id, name, subscription_plan, profile_completion, actor_type)")
    .eq("id", user!.id)
    .single<Member>();

  const org = member?.organizations ?? null;
  const orgId = org?.id ?? null;
  const orgName = org?.name ?? member?.first_name ?? "vous";
  const profileCompletion = org?.profile_completion ?? 0;

  const [rfqResult, matchResult, unreadResult, topMatchesResult, rfqListResult] = await Promise.all([
    supabase
      .from("rfqs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId ?? ""),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("source_org_id", orgId ?? ""),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("member_id", user!.id)
      .eq("is_read", false),
    supabase
      .from("matches")
      .select(
        "id, match_score, match_reasons, target_org:organizations!matches_target_org_id_fkey(id, name, slug, actor_type, logo_url, city)"
      )
      .eq("source_org_id", orgId ?? "")
      .order("match_score", { ascending: false })
      .limit(3),
    supabase
      .from("rfqs")
      .select("id, title, deadline, status")
      .eq("organization_id", orgId ?? "")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const rfqCount = rfqResult.count ?? 0;
  const matchCount = matchResult.count ?? 0;
  const unreadCount = unreadResult.count ?? 0;
  const topMatches = (topMatchesResult.data ?? []) as Match[];
  const rfqList = (rfqListResult.data ?? []) as Rfq[];

  const avgScore =
    topMatches.length > 0
      ? Math.round(topMatches.reduce((acc, m) => acc + m.match_score, 0) / topMatches.length)
      : 0;

  const stats = [
    {
      label: "Projets Actifs",
      value: rfqCount,
      trend: "+2 ce mois",
      trendUp: true,
      icon: "folder_open",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      label: "Matchs IA",
      value: matchCount,
      trend: `${unreadCount} nouveaux`,
      trendUp: unreadCount > 0,
      icon: "hub",
      iconBg: "bg-accent/20 text-primary",
    },
    {
      label: "RFQ en cours",
      value: rfqList.filter((r) => r.status === "open").length,
      trend: `${rfqList.length} total`,
      trendUp: true,
      icon: "request_quote",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      label: "Score moyen",
      value: `${avgScore}%`,
      trend: "Compatibilité IA",
      trendUp: avgScore >= 60,
      icon: "analytics",
      iconBg: "bg-accent/20 text-primary",
    },
  ];

  const insightFactors = [
    { label: "Secteur d'activité", pct: 85 },
    { label: "Zone géographique", pct: 72 },
    { label: "Budget & capacité", pct: 68 },
    { label: "Certifications", pct: Math.min(profileCompletion, 90) },
  ];

  const pipeline = [
    { name: "Projet Solar Liège", pct: 80, color: "bg-accent" },
    { name: "RFQ Bornes EV", pct: 55, color: "bg-primary" },
    { name: "Audit énergétique", pct: 30, color: "bg-slate-300" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-primary font-display">
          Bienvenue, {orgName}
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Voici un aperçu de votre activité sur EnergyHub.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className={`size-12 rounded-xl flex items-center justify-center text-2xl ${s.iconBg}`}>
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  s.trendUp
                    ? "text-green-600 bg-green-100"
                    : "text-red-500 bg-red-100"
                }`}
              >
                {s.trend}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-tight font-medium">
                {s.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid xl:grid-cols-3 gap-8">
        {/* Left: Derniers Matchs IA */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Derniers Matchs IA
            </h3>
            <Link
              href="/dashboard/matches"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Voir tous
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {topMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                hub
              </span>
              <p className="text-slate-500 text-sm mt-3">
                Aucun match IA pour le moment. Complétez votre profil pour en générer.
              </p>
              <Link href="/dashboard/profile" className="btn-primary mt-4 inline-flex text-sm">
                Compléter le profil
              </Link>
            </div>
          ) : (
            topMatches.map((match) => {
              const matchedOrg = match.target_org;
              const reasons = match.match_reasons ?? [];
              return (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-6 items-center"
                >
                  {/* Logo + score */}
                  <div className="relative shrink-0">
                    <div className="size-20 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                      {matchedOrg?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={matchedOrg.logo_url}
                          alt={matchedOrg.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-slate-400">
                          business
                        </span>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 size-8 bg-accent text-primary rounded-full font-bold text-xs flex items-center justify-center shadow-sm">
                      {match.match_score}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-900 truncate">
                        {matchedOrg?.name ?? "Organisation inconnue"}
                      </span>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {ACTOR_TYPE_LABELS[matchedOrg?.actor_type ?? ""] ?? matchedOrg?.actor_type}
                      </span>
                      {matchedOrg?.city && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {matchedOrg.city}
                        </span>
                      )}
                    </div>
                    {reasons.length > 0 && (
                      <p className="text-sm italic text-slate-500 line-clamp-2 mt-1">
                        {reasons[0]}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {reasons.slice(1, 3).map((r, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0">
                    <Link
                      href={`/dashboard/matches`}
                      className="bg-primary text-white rounded-xl px-6 py-3 font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      Voir l&apos;Analyse
                    </Link>
                  </div>
                </div>
              );
            })
          )}

          {/* Appels d'Offres table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900">Appels d&apos;Offres</h3>
              <Link
                href="/dashboard/rfq"
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Gérer
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
            {rfqList.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  request_quote
                </span>
                <p className="text-slate-500 text-sm mt-2">Aucun appel d&apos;offres publié.</p>
                <Link href="/rfq/create" className="btn-primary mt-3 inline-flex text-sm">
                  Créer un RFQ
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium">Titre AO</th>
                    <th className="px-6 py-3 text-left font-medium">Date clôture</th>
                    <th className="px-6 py-3 text-left font-medium">Statut</th>
                    <th className="px-6 py-3 text-left font-medium">Meilleur Match</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqList.map((rfq) => (
                    <tr
                      key={rfq.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-xs">
                        {rfq.title}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(rfq.deadline)}
                      </td>
                      <td className="px-6 py-4">
                        {rfq.status === "open" ? (
                          <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Ouvert
                          </span>
                        ) : rfq.status === "draft" ? (
                          <span className="text-xs font-semibold bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                            Brouillon
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                            {rfq.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* IA Insights */}
          <div className="bg-primary rounded-3xl p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-accent text-2xl">insights</span>
              <h3 className="font-display font-bold text-lg">IA Insights</h3>
            </div>
            <p className="text-white/70 text-sm mb-6">
              Facteurs clés de compatibilité pour vos matchs actuels.
            </p>
            <div className="space-y-4">
              {insightFactors.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{f.label}</span>
                    <span className="font-bold text-accent">{f.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-accent transition-all"
                      style={{ width: `${f.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white/10 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent text-base mt-0.5">check_circle</span>
                <span className="text-white/80">Profil complet à {profileCompletion}%</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent text-base mt-0.5">check_circle</span>
                <span className="text-white/80">{matchCount} correspondances générées</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent text-base mt-0.5">check_circle</span>
                <span className="text-white/80">Mise à jour en temps réel</span>
              </div>
            </div>
          </div>

          {/* Pipeline Projets */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900">Pipeline Projets</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {pipeline.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium truncate">{p.name}</span>
                    <span className="text-slate-500 shrink-0 ml-2">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${p.color} transition-all`}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <Link
                href="/dashboard/rfq"
                className="w-full flex items-center justify-center gap-2 border-2 border-primary/10 text-primary font-semibold text-sm rounded-xl py-2.5 hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                Gérer les projets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
