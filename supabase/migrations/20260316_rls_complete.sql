-- ─── F13: COMPLETE RLS POLICIES ──────────────────────────────────────────────
-- Run this in the Supabase SQL editor to enable full Row Level Security.
-- Idempotent: drops existing policies before recreating them.

-- ─── ENABLE RLS on tables not yet covered ────────────────────────────────────

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "orgs_public_read" ON organizations;
DROP POLICY IF EXISTS "orgs_insert_auth" ON organizations;
DROP POLICY IF EXISTS "orgs_member_update" ON organizations;

CREATE POLICY "orgs_public_read" ON organizations FOR SELECT USING (true);
CREATE POLICY "orgs_insert_auth" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "orgs_member_update" ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM members WHERE id = auth.uid() AND is_org_admin = TRUE
  ));

-- ─── MEMBERS ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "members_self_read" ON members;
DROP POLICY IF EXISTS "members_insert_self" ON members;
DROP POLICY IF EXISTS "members_self_update" ON members;

CREATE POLICY "members_self_read" ON members FOR SELECT USING (id = auth.uid());
CREATE POLICY "members_insert_self" ON members FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "members_self_update" ON members FOR UPDATE USING (id = auth.uid());

-- ─── RFQs ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rfqs_published_read" ON rfqs;
DROP POLICY IF EXISTS "rfqs_insert_own_org" ON rfqs;
DROP POLICY IF EXISTS "rfqs_update_own_org" ON rfqs;
DROP POLICY IF EXISTS "rfqs_delete_own_org" ON rfqs;

CREATE POLICY "rfqs_published_read" ON rfqs FOR SELECT USING (
  status != 'draft' OR organization_id IN (
    SELECT organization_id FROM members WHERE id = auth.uid()
  )
);
CREATE POLICY "rfqs_insert_own_org" ON rfqs FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "rfqs_update_own_org" ON rfqs FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "rfqs_delete_own_org" ON rfqs FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);

-- ─── RFQ RESPONSES ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rfq_responses_read" ON rfq_responses;
DROP POLICY IF EXISTS "rfq_responses_insert" ON rfq_responses;
DROP POLICY IF EXISTS "rfq_responses_update" ON rfq_responses;

CREATE POLICY "rfq_responses_read" ON rfq_responses FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  OR rfq_id IN (
    SELECT id FROM rfqs
    WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  )
);
CREATE POLICY "rfq_responses_insert" ON rfq_responses FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "rfq_responses_update" ON rfq_responses FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  OR rfq_id IN (
    SELECT id FROM rfqs
    WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  )
);

-- ─── DEALS ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "deals_published_read" ON deals;
DROP POLICY IF EXISTS "deals_insert_own_org" ON deals;
DROP POLICY IF EXISTS "deals_update_own_org" ON deals;

CREATE POLICY "deals_published_read" ON deals FOR SELECT USING (
  status = 'published'
  OR organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "deals_insert_own_org" ON deals FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "deals_update_own_org" ON deals FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);

-- ─── DEAL INTERESTS ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "deal_interests_read" ON deal_interests;
DROP POLICY IF EXISTS "deal_interests_insert" ON deal_interests;
DROP POLICY IF EXISTS "deal_interests_update" ON deal_interests;

CREATE POLICY "deal_interests_read" ON deal_interests FOR SELECT USING (
  investor_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  OR deal_id IN (
    SELECT id FROM deals
    WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  )
);
CREATE POLICY "deal_interests_insert" ON deal_interests FOR INSERT WITH CHECK (
  investor_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "deal_interests_update" ON deal_interests FOR UPDATE USING (
  deal_id IN (
    SELECT id FROM deals
    WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  )
);

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "conversations_read" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;

CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (
  (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (
  (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "messages_read" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;

CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT id FROM conversations
    WHERE (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
  )
);

-- ─── MATCHES ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "matches_read_own_org" ON matches;
DROP POLICY IF EXISTS "matches_insert_own_org" ON matches;

CREATE POLICY "matches_read_own_org" ON matches FOR SELECT USING (
  source_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  OR target_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);
CREATE POLICY "matches_insert_own_org" ON matches FOR INSERT WITH CHECK (
  source_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);

-- ─── AGENT LOGS ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "agent_logs_insert_auth" ON agent_logs;
DROP POLICY IF EXISTS "agent_logs_read_own" ON agent_logs;

CREATE POLICY "agent_logs_insert_auth" ON agent_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "agent_logs_read_own" ON agent_logs FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);

-- ─── REVIEWS ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;

CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT WITH CHECK (
  reviewer_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notifs_own" ON notifications;

CREATE POLICY "notifs_own" ON notifications FOR ALL USING (member_id = auth.uid());
