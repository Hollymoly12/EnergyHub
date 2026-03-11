import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";

interface Org {
  id: string;
  name: string;
  logo_url: string | null;
  actor_type: string;
}

export default async function DashboardMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv: initialConvId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!member) redirect("/login");

  const orgId = member.organization_id as string;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_org_ids, subject, last_message_at")
    .contains("participant_org_ids", [orgId])
    .order("last_message_at", { ascending: false });

  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const otherOrgId = (conv.participant_org_ids as string[]).find(id => id !== orgId);

      const [orgResult, lastMsgResult, unreadResult] = await Promise.all([
        otherOrgId
          ? supabase.from("organizations").select("id, name, logo_url, actor_type").eq("id", otherOrgId).single()
          : { data: null },
        supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", user.id),
      ]);

      return {
        id: conv.id,
        participant_org_ids: conv.participant_org_ids as string[],
        subject: conv.subject,
        last_message_at: conv.last_message_at,
        other_org: orgResult.data as Org | null,
        last_message_preview: lastMsgResult.data?.content || null,
        unread_count: unreadResult.count || 0,
      };
    })
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="px-8 py-5 border-b border-slate-800 shrink-0">
        <h1 className="font-display text-xl font-bold text-white">Messages</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {enriched.length} conversation{enriched.length > 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessagesClient
          conversations={enriched}
          currentUserId={user.id}
          initialConvId={initialConvId}
        />
      </div>
    </div>
  );
}
