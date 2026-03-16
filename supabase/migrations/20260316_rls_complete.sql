-- ─── F13: COMPLETE RLS POLICIES ──────────────────────────────────────────────
-- Run this in the Supabase SQL editor to enable full Row Level Security.
-- After running, all tables are protected — only authenticated users can access
-- their own data. Service role (webhooks, agents via createAdminClient) bypasses RLS.

-- ─── ENABLE RLS on tables not yet covered ────────────────────────────────────

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

-- INSERT: any authenticated user can create an org at registration
CREATE POLICY "orgs_insert_auth" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── MEMBERS ──────────────────────────────────────────────────────────────────

-- INSERT: user can create their own member row (id must match their auth uid)
CREATE POLICY "members_insert_self" ON members
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── RFQs ────────────────────────────────────────────────────────────────────

CREATE POLICY "rfqs_insert_own_org" ON rfqs
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

CREATE POLICY "rfqs_update_own_org" ON rfqs
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

CREATE POLICY "rfqs_delete_own_org" ON rfqs
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- ─── RFQ RESPONSES ───────────────────────────────────────────────────────────

-- Visible to: the responding org OR the rfq owner org
CREATE POLICY "rfq_responses_read" ON rfq_responses
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    OR rfq_id IN (
      SELECT id FROM rfqs
      WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    )
  );

CREATE POLICY "rfq_responses_insert" ON rfq_responses
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- Update allowed by: responder org (edit their response) or rfq owner org (set ai_score etc.)
CREATE POLICY "rfq_responses_update" ON rfq_responses
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    OR rfq_id IN (
      SELECT id FROM rfqs
      WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    )
  );

-- ─── DEALS ───────────────────────────────────────────────────────────────────

-- Published deals visible to all authenticated users; drafts only to own org
CREATE POLICY "deals_published_read" ON deals
  FOR SELECT USING (
    status = 'published'
    OR organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

CREATE POLICY "deals_insert_own_org" ON deals
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- Update includes AI analysis writes (analyzeDeal agent runs in user context)
CREATE POLICY "deals_update_own_org" ON deals
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- ─── DEAL INTERESTS ──────────────────────────────────────────────────────────

-- Visible to: the investor org OR the deal owner org
CREATE POLICY "deal_interests_read" ON deal_interests
  FOR SELECT USING (
    investor_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    OR deal_id IN (
      SELECT id FROM deals
      WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    )
  );

-- Investor can express interest (investor_org_id must be their org)
CREATE POLICY "deal_interests_insert" ON deal_interests
  FOR INSERT WITH CHECK (
    investor_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- Deal owner can update interest status (e.g. in_discussion, passed)
CREATE POLICY "deal_interests_update" ON deal_interests
  FOR UPDATE USING (
    deal_id IN (
      SELECT id FROM deals
      WHERE organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    )
  );

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────

-- Visible to members whose org is in participant_org_ids
CREATE POLICY "conversations_read" ON conversations
  FOR SELECT USING (
    (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
  );

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

CREATE POLICY "messages_read" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
    )
  );

-- sender_id must be the authenticated user themselves
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE (SELECT organization_id FROM members WHERE id = auth.uid()) = ANY(participant_org_ids)
    )
  );

-- ─── MATCHES ────────────────────────────────────────────────────────────────

-- Visible to either org in the match
CREATE POLICY "matches_read_own_org" ON matches
  FOR SELECT USING (
    source_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
    OR target_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- AI matching agent runs in user context → source_org must be the user's org
CREATE POLICY "matches_insert_own_org" ON matches
  FOR INSERT WITH CHECK (
    source_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- ─── AGENT LOGS ──────────────────────────────────────────────────────────────

-- Any authenticated user can insert logs (agents always run in user context)
CREATE POLICY "agent_logs_insert_auth" ON agent_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Own org can read their agent logs
CREATE POLICY "agent_logs_read_own" ON agent_logs
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );

-- ─── REVIEWS ────────────────────────────────────────────────────────────────

CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_org_id IN (SELECT organization_id FROM members WHERE id = auth.uid())
  );
