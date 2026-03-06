-- ═══════════════════════════════════════════════════════════════════════════
-- ENERGYHUB — SCHÉMA BASE DE DONNÉES COMPLET
-- Supabase (PostgreSQL) — v1.0
-- ═══════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche full-text

-- ─── TYPES ENUM ─────────────────────────────────────────────────────────────

CREATE TYPE actor_type AS ENUM (
  'industrial',      -- Industriel / Acheteur énergie
  'installer',       -- Installateur hardware
  'software_editor', -- Éditeur logiciel
  'investor',        -- Fonds d'investissement / BA
  'energy_provider', -- Fournisseur d'énergie
  'esco',            -- ESCO / Consultant
  'greentech'        -- Startup GreenTech
);

CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');

CREATE TYPE rfq_status AS ENUM (
  'draft', 'published', 'responses_open', 'under_review', 'closed', 'cancelled'
);

CREATE TYPE rfq_type AS ENUM ('rfi', 'rfq', 'rfp');

CREATE TYPE response_status AS ENUM (
  'submitted', 'under_review', 'shortlisted', 'rejected', 'selected'
);

CREATE TYPE deal_status AS ENUM (
  'draft', 'published', 'nda_required', 'under_review',
  'interest_expressed', 'due_diligence', 'term_sheet', 'closed', 'cancelled'
);

CREATE TYPE agent_event_type AS ENUM (
  'onboarding', 'matching', 'rfq_analysis', 'communication', 'scoring'
);

-- ─── ORGANISATIONS ──────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  actor_type actor_type NOT NULL,
  description TEXT,
  short_description TEXT, -- max 160 chars pour les listings

  -- Localisation
  country TEXT DEFAULT 'BE',
  region TEXT, -- Wallonie, Flandre, Bruxelles
  city TEXT,
  address TEXT,

  -- Contact
  website TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- Médias
  logo_url TEXT,
  cover_image_url TEXT,
  pitch_deck_url TEXT, -- Pour les porteurs de projets

  -- Certifications & tags
  certifications TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',

  -- Abonnement
  subscription_plan subscription_plan DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,

  -- Profil
  founded_year INT,
  team_size TEXT, -- "1-10", "11-50", "51-200", "200+"
  annual_revenue TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  profile_completion INT DEFAULT 0, -- 0-100

  -- Scores
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  profile_views INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEMBRES / UTILISATEURS ──────────────────────────────────────────────────

CREATE TABLE members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Profil personnel
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  job_title TEXT,

  -- Rôle dans la plateforme
  is_org_admin BOOLEAN DEFAULT FALSE,
  is_platform_admin BOOLEAN DEFAULT FALSE,

  -- Préférences
  notification_email BOOLEAN DEFAULT TRUE,
  notification_rfq BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'fr',

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RFI / RFQ ───────────────────────────────────────────────────────────────

CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES members(id),

  -- Contenu
  type rfq_type NOT NULL DEFAULT 'rfq',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT, -- Cahier des charges détaillé
  budget_range TEXT,
  deadline DATE,
  location TEXT,

  -- Ciblage
  target_actor_types actor_type[] DEFAULT '{}',
  target_technologies TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Statut
  status rfq_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,

  -- Stats
  views_count INT DEFAULT 0,
  responses_count INT DEFAULT 0,
  matched_actors_count INT DEFAULT 0,

  -- Agent AI
  ai_summary TEXT,           -- Résumé généré par Claude
  ai_requirements_parsed JSONB, -- Besoins structurés par Claude
  ai_matched_at TIMESTAMPTZ,

  -- Visibilité
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE, -- RFQ boosté (payant)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Réponses aux RFQ
CREATE TABLE rfq_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES members(id),

  -- Contenu
  message TEXT NOT NULL,
  proposal_url TEXT, -- Document de proposition uploadé
  price_range TEXT,
  delivery_timeline TEXT,
  technical_details JSONB,

  -- Statut
  status response_status DEFAULT 'submitted',

  -- AI Scoring
  ai_score INT, -- 0-100
  ai_score_details JSONB, -- Détails du scoring par critère
  ai_summary TEXT, -- Résumé de la réponse par Claude
  ai_red_flags TEXT[], -- Points d'attention détectés

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MODULE INVESTISSEMENT ───────────────────────────────────────────────────

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES members(id),

  -- Projet
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_type TEXT, -- 'solar', 'wind', 'storage', 'efficiency', 'other'
  location TEXT,
  capacity_mw DECIMAL(10,2),

  -- Financement
  funding_amount BIGINT, -- en euros
  funding_type TEXT, -- 'equity', 'debt', 'convertible', 'grant'
  series TEXT, -- 'pre-seed', 'seed', 'series-a', etc.
  irr_target DECIMAL(5,2), -- %
  duration_years INT,
  current_investors TEXT,

  -- Documents
  pitch_deck_url TEXT,
  financial_model_url TEXT,
  legal_docs_url TEXT,

  -- Statut
  status deal_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  requires_nda BOOLEAN DEFAULT TRUE,

  -- Stats
  views_count INT DEFAULT 0,
  interests_count INT DEFAULT 0,

  -- AI
  ai_summary TEXT,
  ai_investment_thesis TEXT,
  ai_risk_score INT, -- 0-100 (0=low risk)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intérêts des investisseurs pour un deal
CREATE TABLE deal_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  investor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expressed_by UUID NOT NULL REFERENCES members(id),

  nda_signed BOOLEAN DEFAULT FALSE,
  nda_signed_at TIMESTAMPTZ,
  message TEXT,
  status TEXT DEFAULT 'interested', -- 'interested', 'in_discussion', 'passed'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MATCHING ────────────────────────────────────────────────────────────────

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_org_id UUID NOT NULL REFERENCES organizations(id),
  target_org_id UUID NOT NULL REFERENCES organizations(id),
  rfq_id UUID REFERENCES rfqs(id), -- Si lié à un RFQ

  match_score INT NOT NULL, -- 0-100
  match_reasons TEXT[] DEFAULT '{}',
  match_criteria JSONB,

  -- Statut de l'interaction
  is_notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  is_viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGERIE ──────────────────────────────────────────────────────────────

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_org_ids UUID[] NOT NULL,
  rfq_id UUID REFERENCES rfqs(id),
  deal_id UUID REFERENCES deals(id),
  subject TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES members(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AVIS & NOTATIONS ────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_org_id UUID NOT NULL REFERENCES organizations(id),
  reviewed_org_id UUID NOT NULL REFERENCES organizations(id),
  rfq_id UUID REFERENCES rfqs(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_org_id, reviewed_org_id, rfq_id)
);

-- ─── LOGS AGENTS CLAUDE ──────────────────────────────────────────────────────

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type agent_event_type NOT NULL,
  trigger_event TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  member_id UUID REFERENCES members(id),
  rfq_id UUID REFERENCES rfqs(id),
  deal_id UUID REFERENCES deals(id),

  -- Entrée / Sortie
  input_data JSONB,
  output_data JSONB,
  tokens_used INT,
  cost_usd DECIMAL(10,6),

  -- Performance
  duration_ms INT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_rfq', 'new_match', 'rfq_response', 'deal_interest', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEX POUR PERFORMANCES ─────────────────────────────────────────────────

CREATE INDEX idx_organizations_type ON organizations(actor_type);
CREATE INDEX idx_organizations_plan ON organizations(subscription_plan);
CREATE INDEX idx_organizations_verified ON organizations(is_verified);
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_tags ON organizations USING GIN(tags);
CREATE INDEX idx_organizations_technologies ON organizations USING GIN(technologies);
-- Full-text search sur les organisations
CREATE INDEX idx_organizations_fts ON organizations USING GIN(
  to_tsvector('french', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,''))
);

CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_org ON rfqs(organization_id);
CREATE INDEX idx_rfqs_type ON rfqs(type);

CREATE INDEX idx_matches_score ON matches(match_score DESC);
CREATE INDEX idx_matches_source ON matches(source_org_id);

CREATE INDEX idx_notifications_member ON notifications(member_id, is_read);
CREATE INDEX idx_agent_logs_type ON agent_logs(agent_type, created_at DESC);

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Organisations : visibles par tous, modifiables par les admins de l'org
CREATE POLICY "orgs_public_read" ON organizations FOR SELECT USING (true);
CREATE POLICY "orgs_member_update" ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM members WHERE id = auth.uid() AND is_org_admin = TRUE
  ));

-- Members : visible par soi-même et admins plateforme
CREATE POLICY "members_self_read" ON members FOR SELECT USING (id = auth.uid());
CREATE POLICY "members_self_update" ON members FOR UPDATE USING (id = auth.uid());

-- RFQs : publiés visibles par tous les Pro+, brouillons par créateur seulement
CREATE POLICY "rfqs_published_read" ON rfqs FOR SELECT
  USING (status != 'draft' OR organization_id IN (
    SELECT organization_id FROM members WHERE id = auth.uid()
  ));

-- Notifications : seulement les siennes
CREATE POLICY "notifs_own" ON notifications FOR ALL USING (member_id = auth.uid());

-- ─── FONCTIONS UTILITAIRES ───────────────────────────────────────────────────

-- Calcul automatique du score de complétion de profil
CREATE OR REPLACE FUNCTION calculate_profile_completion(org_id UUID)
RETURNS INT AS $$
DECLARE
  org organizations%ROWTYPE;
  score INT := 0;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  IF org.name IS NOT NULL AND org.name != '' THEN score := score + 15; END IF;
  IF org.description IS NOT NULL AND length(org.description) > 100 THEN score := score + 20; END IF;
  IF org.logo_url IS NOT NULL THEN score := score + 15; END IF;
  IF org.website IS NOT NULL THEN score := score + 10; END IF;
  IF org.city IS NOT NULL THEN score := score + 10; END IF;
  IF array_length(org.certifications, 1) > 0 THEN score := score + 10; END IF;
  IF array_length(org.tags, 1) > 0 THEN score := score + 10; END IF;
  IF org.phone IS NOT NULL THEN score := score + 5; END IF;
  IF org.linkedin_url IS NOT NULL THEN score := score + 5; END IF;
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rfqs_updated BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── DONNÉES INITIALES ───────────────────────────────────────────────────────

-- Organisation EnergyHub elle-même (super admin)
INSERT INTO organizations (name, slug, actor_type, description, country, subscription_plan, is_verified)
VALUES ('EnergyHub', 'energyhub', 'software_editor',
        'La marketplace de la transition énergétique belge', 'BE', 'enterprise', TRUE);
