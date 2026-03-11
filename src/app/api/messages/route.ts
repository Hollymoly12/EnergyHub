import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase
      .from("members")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const orgId = member.organization_id as string;
    const body = await req.json();

    if (body.action === "create_conversation") {
      const { targetOrgId, firstMessage, subject } = body;
      if (!targetOrgId || !firstMessage?.trim()) {
        return NextResponse.json({ error: "targetOrgId and firstMessage required" }, { status: 400 });
      }
      if (targetOrgId === orgId) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }

      // Return existing conversation if one already exists between these orgs
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .contains("participant_org_ids", [orgId, targetOrgId])
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ conversationId: existing.id }, { status: 200 });
      }

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          participant_org_ids: [orgId, targetOrgId],
          subject: subject || null,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) return NextResponse.json({ error: convError.message }, { status: 500 });

      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: firstMessage.trim(),
        });

      if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

      return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
    }

    if (body.action === "send_message") {
      const { conversationId, content } = body;
      if (!conversationId || !content?.trim()) {
        return NextResponse.json({ error: "conversationId and content required" }, { status: 400 });
      }

      const { data: conv } = await supabase
        .from("conversations")
        .select("participant_org_ids")
        .eq("id", conversationId)
        .single();

      if (!conv || !(conv.participant_org_ids as string[]).includes(orgId)) {
        return NextResponse.json({ error: "Not a participant" }, { status: 403 });
      }

      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return NextResponse.json({ message }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
