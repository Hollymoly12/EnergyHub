# Dashboard Messages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer `/dashboard/messages` — messagerie interne split view avec Supabase Realtime, et modal "Contacter" depuis la page matches.

**Architecture:** Server Component pour le fetch initial des conversations. Client Component `MessagesClient` pour le split view, l'envoi de messages, et l'abonnement Supabase Realtime. API route `/api/messages` pour créer conversations et envoyer messages. `ContactModal` modifie `MatchesClient` pour permettre de contacter depuis un match.

**Tech Stack:** Next.js 15 App Router, Supabase browser client (`@supabase/ssr`), Supabase Realtime (`postgres_changes`), Tailwind CSS, classes custom `.card` `.btn-primary` `.btn-secondary` `.input`

---

## Contexte important

- **Client Supabase browser** : `createClient` depuis `@/lib/supabase/client` (pas server) pour le Realtime
- **Client Supabase server** : `createClient` depuis `@/lib/supabase/server` pour les server components et API routes
- **Couleurs Tailwind** : `bg-slate-900`, `border-slate-800`, `text-yellow-500`, `text-green-400` — PAS de `bg-surface-*`
- **conversations** : `id`, `participant_org_ids UUID[]`, `subject TEXT`, `last_message_at`, `created_at`
- **messages** : `id`, `conversation_id`, `sender_id` (member id), `content`, `is_read`, `created_at`
- **Supabase Realtime** : `supabase.channel(name).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.ID' }, callback).subscribe()`
- **Cleanup Realtime** : retourner `() => supabase.removeChannel(channel)` dans le useEffect
- **Sidebar** : lien `/dashboard/messages` déjà présent dans layout.tsx

---

### Task 1: API route /api/messages

**Files:**
- Create: `src/app/api/messages/route.ts`

**Step 1: Créer la route**

```typescript
// src/app/api/messages/route.ts
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

      // Créer la conversation
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

      // Envoyer le premier message
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

      // Vérifier que l'org est participante
      const { data: conv } = await supabase
        .from("conversations")
        .select("participant_org_ids")
        .eq("id", conversationId)
        .single();

      if (!conv || !(conv.participant_org_ids as string[]).includes(orgId)) {
        return NextResponse.json({ error: "Not a participant" }, { status: 403 });
      }

      // Insérer le message
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

      // Update last_message_at
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
```

**Step 2: Commit**

```bash
git add src/app/api/messages/route.ts
git commit -m "feat: POST /api/messages route (create_conversation + send_message)"
```

---

### Task 2: MessagesClient — split view + Realtime

**Files:**
- Create: `src/app/dashboard/messages/MessagesClient.tsx`

**Step 1: Créer le composant**

```typescript
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
  currentOrgId: string;
  currentUserId: string;
  initialConvId?: string;
}

export default function MessagesClient({ conversations, currentOrgId, currentUserId, initialConvId }: Props) {
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId || conversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Fetch messages quand conversation change
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
  }, [activeConvId]);

  // Scroll to bottom quand messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime
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
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

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
        setNewMessage(content); // restore
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
      {/* ── Liste conversations ── */}
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

      {/* ── Zone messages ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            {/* Header */}
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

            {/* Messages */}
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

            {/* Input */}
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/messages/MessagesClient.tsx
git commit -m "feat: MessagesClient split view with Supabase Realtime"
```

---

### Task 3: Page Server Component

**Files:**
- Create: `src/app/dashboard/messages/page.tsx`

**Step 1: Créer la page**

```typescript
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

  // Fetch conversations où l'org est participante
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_org_ids, subject, last_message_at")
    .contains("participant_org_ids", [orgId])
    .order("last_message_at", { ascending: false });

  // Pour chaque conversation, récupérer l'org partenaire + dernier message + unread count
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
          currentOrgId={orgId}
          currentUserId={user.id}
          initialConvId={initialConvId}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/messages/page.tsx
git commit -m "feat: dashboard messages server page"
```

---

### Task 4: ContactModal + modifier MatchesClient

**Files:**
- Create: `src/app/dashboard/matches/ContactModal.tsx`
- Modify: `src/app/dashboard/matches/MatchesClient.tsx`

**Step 1: Créer ContactModal**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetOrgId: string;
  targetOrgName: string;
  onClose: () => void;
}

export default function ContactModal({ targetOrgId, targetOrgName, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_conversation",
            targetOrgId,
            firstMessage: message.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        router.push(`/dashboard/messages?conv=${data.conversationId}`);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Contacter {targetOrgName}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Présentez-vous et expliquez l'objet de votre prise de contact..."
              required
              minLength={10}
              autoFocus
            />
            <p className="text-[10px] text-slate-600 mt-1">{message.length} / 10 min</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || message.trim().length < 10}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isPending ? "Envoi..." : "Envoyer →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Modifier MatchesClient**

Lire `src/app/dashboard/matches/MatchesClient.tsx` et faire ces modifications :

1. Ajouter l'import en haut :
```typescript
import ContactModal from "./ContactModal";
```

2. Ajouter un state dans `MatchesClient` :
```typescript
const [contactingOrg, setContactingOrg] = useState<{ id: string; name: string } | null>(null);
```

3. Modifier le bouton "Contacter" dans `MatchCard` pour qu'il passe une callback :
```tsx
// MatchCard reçoit un prop supplémentaire
interface MatchCardProps {
  match: Match;
  onContact: (orgId: string, orgName: string) => void;
}

// Dans MatchCard, remplacer le Link "Contacter" par :
<button
  onClick={() => onContact(org.id, org.name)}
  className="btn-primary text-xs py-2 flex-1"
>
  Contacter
</button>
```

4. Passer `onContact` depuis `MatchesClient` :
```tsx
<MatchCard key={match.id} match={match} onContact={(id, name) => setContactingOrg({ id, name })} />
```

5. Ajouter le modal à la fin du return de `MatchesClient` :
```tsx
{contactingOrg && (
  <ContactModal
    targetOrgId={contactingOrg.id}
    targetOrgName={contactingOrg.name}
    onClose={() => setContactingOrg(null)}
  />
)}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/matches/ContactModal.tsx src/app/dashboard/matches/MatchesClient.tsx
git commit -m "feat: ContactModal + wire Contacter button in MatchesClient"
```

---

### Task 5: Vérification TypeScript

**Step 1:**
```bash
npx tsc --noEmit 2>&1 | grep -E "dashboard/messages|api/messages|dashboard/matches/Contact"
```
Expected: aucune sortie

**Step 2: Commit si corrections**
```bash
git add -A
git commit -m "fix: TypeScript corrections F9"
```

---

### Task 6: Vérification manuelle

**Step 1:** `npm run dev`

**Checklist:**
- [ ] `/dashboard/messages` s'affiche — split view visible
- [ ] Si aucune conversation : état vide avec lien /dashboard/matches
- [ ] `/dashboard/matches` — bouton "Contacter" ouvre le modal
- [ ] Modal : saisir un message (min 10 chars) → "Envoyer" → redirect vers `/dashboard/messages?conv=[id]`
- [ ] Conversation apparaît dans la liste gauche
- [ ] Cliquer conversation → messages s'affichent à droite
- [ ] Envoyer un message → apparaît instantanément (Realtime)
- [ ] URL `?conv=[id]` → conversation correspondante sélectionnée au chargement

**Step 2:**
```bash
git push origin main
```
