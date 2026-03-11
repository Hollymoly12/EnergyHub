"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface Org {
  id: string;
  name: string;
  logo_url: string | null;
  actor_type: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_org_ids: string[];
  subject: string | null;
  last_message_at: string;
  other_org: Org | null;
  last_message_preview: string | null;
  unread_count: number;
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
  initialConvId?: string;
}

export default function MessagesClient({ conversations, currentUserId, initialConvId }: Props) {
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId || conversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const activeConv = conversations.find(c => c.id === activeConvId);

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMessages(true);
    supabase
      .from("messages")
      .select("id, sender_id, content, is_read, created_at")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data || []);
        setLoadingMessages(false);
      });
  }, [activeConvId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, supabase]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;
    setError(null);
    const content = newMessage.trim();
    setNewMessage("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send_message", conversationId: activeConvId, content }),
        });
        if (!res.ok) throw new Error("Erreur lors de l'envoi");
      } catch (e) {
        setError((e as Error).message);
        setNewMessage(content);
      }
    });
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-600">
          <div className="text-4xl mb-4">✉️</div>
          <p className="text-white font-semibold mb-2">Aucune conversation</p>
          <p className="text-slate-500 text-sm mb-6">
            Contactez une organisation depuis vos matchs pour démarrer une conversation.
          </p>
          <a href="/dashboard/matches" className="btn-primary text-sm">Voir mes matchs →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Liste conversations */}
      <div className="w-80 shrink-0 border-r border-slate-800 overflow-y-auto">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setActiveConvId(conv.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
              activeConvId === conv.id ? "bg-slate-800" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                {conv.other_org?.logo_url
                  ? <img src={conv.other_org.logo_url} alt="" className="w-full h-full object-cover" />
                  : "🏢"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-white truncate">
                    {conv.other_org?.name || "Organisation"}
                  </span>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {new Date(conv.last_message_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {conv.last_message_preview || conv.subject || "Nouvelle conversation"}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-[10px] text-black font-bold flex items-center justify-center shrink-0">
                  {conv.unread_count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Zone messages */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm overflow-hidden">
                {activeConv.other_org?.logo_url
                  ? <img src={activeConv.other_org.logo_url} alt="" className="w-full h-full object-cover" />
                  : "🏢"}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{activeConv.other_org?.name}</div>
                {activeConv.subject && <div className="text-xs text-slate-500">{activeConv.subject}</div>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMessages ? (
                <div className="text-center text-slate-600 text-sm py-8">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-600 text-sm py-8">Aucun message</div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOwn
                          ? "bg-yellow-500/20 text-yellow-100 rounded-br-sm"
                          : "bg-slate-800 text-slate-300 rounded-bl-sm"
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 ${isOwn ? "text-yellow-500/60 text-right" : "text-slate-600"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="px-6 py-4 border-t border-slate-800">
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <div className="flex gap-3">
                <input
                  className="input flex-1"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Écrire un message..."
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !newMessage.trim()}
                  className="btn-primary px-5 disabled:opacity-50"
                >
                  {isPending ? "..." : "Envoyer"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}
