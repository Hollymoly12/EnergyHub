# Design — F9: /dashboard/messages

**Date:** 2026-03-10
**Feature:** Messagerie interne — split view avec Supabase Realtime

## Objectif

Interface de messagerie en temps réel entre organisations. Split view (liste conversations à gauche, messages à droite). Modal "Contacter" depuis la page matches pour créer une conversation.

## Architecture

### Fichiers
- `src/app/dashboard/messages/page.tsx` — Server Component, fetch conversations initiales
- `src/app/dashboard/messages/MessagesClient.tsx` — Client Component principal (split view + Realtime)
- `src/app/dashboard/matches/ContactModal.tsx` — Client Component modal "Contacter"
- `src/app/api/messages/route.ts` — POST (create_conversation | send_message)

## Schéma DB

### conversations
- `participant_org_ids UUID[]` — tableau des orgs participantes
- `subject TEXT` — sujet optionnel
- `last_message_at TIMESTAMPTZ`

### messages
- `conversation_id UUID`
- `sender_id UUID` (member id)
- `content TEXT`
- `is_read BOOLEAN`

## UI

### Split view
**Gauche (w-80)** : liste conversations — avatar org + nom + dernier message truncate + timestamp + badge non lu + surbrillance active
**Droite (flex-1)** : messages scrollables — messages sortants (jaune, droite) / entrants (gris, gauche) + input + bouton Envoyer
**État vide** : texte + lien /dashboard/matches

### Realtime
`supabase.channel('messages').on('postgres_changes', { event: 'INSERT', table: 'messages', filter: 'conversation_id=eq.[id]' })` → append message live

## API /api/messages (POST)

Body : `{ action: "create_conversation" | "send_message", ... }`

### create_conversation
- Input : `{ targetOrgId, firstMessage, subject? }`
- Crée conversation avec participant_org_ids = [sourceOrgId, targetOrgId]
- Insère premier message
- Retourne `{ conversationId }`

### send_message
- Input : `{ conversationId, content }`
- Vérifie que l'org est participante
- Insère message
- Update conversations.last_message_at
- Retourne `{ message }`

## Modal "Contacter"

- Modifie `MatchesClient.tsx` : bouton "Contacter" → state `contactingOrgId`
- `ContactModal` : overlay, nom org cible, textarea message (min 10 chars), bouton Envoyer
- POST /api/messages action=create_conversation → router.push("/dashboard/messages?conv=[id]")
