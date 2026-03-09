import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  if (!member) redirect("/login");

  // Dernières suggestions de l'agent onboarding
  const { data: agentSuggestion } = await supabase
    .from("agent_logs")
    .select("output_data, created_at")
    .eq("agent_type", "onboarding")
    .eq("organization_id", member.organization_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const org = member.organizations as Record<string, unknown>;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Profil de l'organisation
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Un profil complet génère 3× plus de contacts et améliore votre matching IA.
        </p>
      </div>

      <ProfileForm
        org={org}
        memberId={user.id}
        agentSuggestion={agentSuggestion?.output_data as Record<string, unknown> | null}
      />
    </div>
  );
}
