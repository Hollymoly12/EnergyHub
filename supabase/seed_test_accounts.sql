-- ═══════════════════════════════════════════════════════════════════════════
-- ENERGYHUB — SEED COMPTES DE TEST
-- 7 comptes (un par actor_type) + 1 compte admin platform
-- Mot de passe universel : EnergyHub2024!
--
-- INSTRUCTIONS :
--   1. Ouvrir Supabase Dashboard → SQL Editor
--   2. Coller et exécuter ce script complet
--   3. Les comptes sont immédiatement utilisables
-- ═══════════════════════════════════════════════════════════════════════════

-- Extension nécessaire pour bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- UUIDs fixes pour reproductibilité
  uid_industrial      UUID := 'a1000000-0000-0000-0000-000000000001';
  uid_installer       UUID := 'a1000000-0000-0000-0000-000000000002';
  uid_software        UUID := 'a1000000-0000-0000-0000-000000000003';
  uid_investor        UUID := 'a1000000-0000-0000-0000-000000000004';
  uid_energy          UUID := 'a1000000-0000-0000-0000-000000000005';
  uid_esco            UUID := 'a1000000-0000-0000-0000-000000000006';
  uid_greentech       UUID := 'a1000000-0000-0000-0000-000000000007';
  uid_admin           UUID := 'a1000000-0000-0000-0000-000000000008';

  org_industrial      UUID := 'b1000000-0000-0000-0000-000000000001';
  org_installer       UUID := 'b1000000-0000-0000-0000-000000000002';
  org_software        UUID := 'b1000000-0000-0000-0000-000000000003';
  org_investor        UUID := 'b1000000-0000-0000-0000-000000000004';
  org_energy          UUID := 'b1000000-0000-0000-0000-000000000005';
  org_esco            UUID := 'b1000000-0000-0000-0000-000000000006';
  org_greentech       UUID := 'b1000000-0000-0000-0000-000000000007';
  org_admin           UUID := 'b1000000-0000-0000-0000-000000000008';

  pwd_hash TEXT;
BEGIN
  -- Hash du mot de passe EnergyHub2024!
  pwd_hash := crypt('EnergyHub2024!', gen_salt('bf', 10));

  -- ─── 1. AUTH USERS ──────────────────────────────────────────────────────
  -- Supprime les comptes existants si re-run du script
  DELETE FROM auth.users WHERE id IN (
    uid_industrial, uid_installer, uid_software, uid_investor,
    uid_energy, uid_esco, uid_greentech, uid_admin
  );

  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    (uid_industrial, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.industrial@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Marc","last_name":"Dupont"}',
     FALSE, '', '', '', ''),

    (uid_installer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.installer@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Julie","last_name":"Maes"}',
     FALSE, '', '', '', ''),

    (uid_software, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.software@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Thomas","last_name":"Leroy"}',
     FALSE, '', '', '', ''),

    (uid_investor, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.investor@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Sophie","last_name":"Vanderberg"}',
     FALSE, '', '', '', ''),

    (uid_energy, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.energy@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Pierre","last_name":"Collin"}',
     FALSE, '', '', '', ''),

    (uid_esco, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.esco@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Nathalie","last_name":"Simon"}',
     FALSE, '', '', '', ''),

    (uid_greentech, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'test.greentech@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Alexis","last_name":"Bernard"}',
     FALSE, '', '', '', ''),

    (uid_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'admin@energyhub.be', pwd_hash, NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}', '{"first_name":"Admin","last_name":"EnergyHub"}',
     FALSE, '', '', '', '');

  -- ─── 2. ORGANISATIONS ────────────────────────────────────────────────────
  DELETE FROM organizations WHERE id IN (
    org_industrial, org_installer, org_software, org_investor,
    org_energy, org_esco, org_greentech, org_admin
  );

  INSERT INTO organizations (
    id, name, slug, actor_type, description, short_description,
    country, region, city,
    website, phone, linkedin_url,
    certifications, tags, technologies,
    subscription_plan, founded_year, team_size,
    is_verified, profile_completion
  ) VALUES
    -- 1. Industriel
    (org_industrial, 'Acier Wallon SA', 'acier-wallon-sa', 'industrial',
     'Grand groupe sidérurgique belge avec une consommation énergétique annuelle de 450 GWh. Nous cherchons activement à décarboner notre production via des PPAs solaires et des solutions d''efficacité énergétique.',
     'Sidérurgie belge en transition énergétique — 450 GWh/an',
     'BE', 'Wallonie', 'Liège',
     'https://example.com', '+32 4 123 45 67', 'https://linkedin.com/company/acier-wallon',
     ARRAY['ISO 50001', 'ISO 14001'], ARRAY['décarbonation', 'PPA', 'efficacité énergétique', 'sidérurgie'],
     ARRAY['solar', 'efficiency'],
     'pro', 1962, '200+',
     TRUE, 85),

    -- 2. Installateur
    (org_installer, 'SolarTech Install', 'solartech-install', 'installer',
     'Entreprise spécialisée dans l''installation de systèmes photovoltaïques industriels et commerciaux en Belgique. Plus de 500 installations réalisées depuis 2010, de 10 kWc à 5 MWc.',
     'Installateur PV industriel — 500+ projets en Belgique',
     'BE', 'Flandre', 'Gand',
     'https://example.com', '+32 9 234 56 78', 'https://linkedin.com/company/solartech-install',
     ARRAY['Agrément VREG', 'Qualifelec', 'Certibeau'], ARRAY['PV industriel', 'toiture', 'carport', 'résidentiel'],
     ARRAY['solar', 'storage'],
     'pro', 2010, '11-50',
     TRUE, 92),

    -- 3. Éditeur logiciel
    (org_software, 'GridSense Software', 'gridsense-software', 'software_editor',
     'Éditeur de solutions SaaS pour la gestion de l''énergie (EMS) et l''optimisation de la flexibilité. Notre plateforme pilote des assets pour 200+ clients industriels en Europe.',
     'SaaS EMS & flexibilité énergétique — 200+ clients industriels',
     'BE', 'Bruxelles', 'Bruxelles',
     'https://example.com', '+32 2 345 67 89', 'https://linkedin.com/company/gridsense',
     ARRAY['ISO 27001', 'SOC 2 Type II'], ARRAY['EMS', 'SCADA', 'flexibilité', 'demand response', 'API'],
     ARRAY['software', 'iot', 'ai'],
     'enterprise', 2016, '51-200',
     TRUE, 78),

    -- 4. Investisseur
    (org_investor, 'Green Capital Partners', 'green-capital-partners', 'investor',
     'Fonds d''investissement spécialisé dans les infrastructures de transition énergétique en Europe. Ticket moyen : 5-25 M€. Focus : solaire utility-scale, stockage, hydrogène vert.',
     'Fonds infrastructure énergie — tickets 5-25 M€',
     'BE', 'Bruxelles', 'Bruxelles',
     'https://example.com', '+32 2 456 78 90', 'https://linkedin.com/company/green-capital',
     ARRAY['AIFMD', 'SFDR Article 9'], ARRAY['infrastructure', 'solaire', 'stockage', 'hydrogène', 'ESG'],
     ARRAY['solar', 'storage', 'hydrogen', 'wind'],
     'enterprise', 2018, '11-50',
     TRUE, 95),

    -- 5. Fournisseur d'énergie
    (org_energy, 'Luminus Green', 'luminus-green', 'energy_provider',
     'Fournisseur d''énergie 100% renouvelable pour les entreprises belges. PPA sur mesure, offres à prix fixe, accompagnement dans la transition énergétique et solutions de recharge véhicules électriques.',
     'Fournisseur d''énergie verte B2B — PPA & offres sur mesure',
     'BE', 'Wallonie', 'Namur',
     'https://example.com', '+32 81 567 89 01', 'https://linkedin.com/company/luminus-green',
     ARRAY['Garanties d''Origine', 'VREG', 'CWaPE'], ARRAY['PPA', 'énergie verte', 'recharge EV', 'contrat fixe'],
     ARRAY['solar', 'wind', 'storage'],
     'pro', 2005, '200+',
     TRUE, 88),

    -- 6. ESCO / Consultant
    (org_esco, 'EcoPerform Consulting', 'ecoperform-consulting', 'esco',
     'ESCO belge proposant des contrats de performance énergétique (CPE) clé en main pour l''industrie et le tertiaire. Nous finançons, installons et garantissons les économies sur 10-15 ans.',
     'ESCO — CPE garanti pour industrie & tertiaire',
     'BE', 'Flandre', 'Anvers',
     'https://example.com', '+32 3 678 90 12', 'https://linkedin.com/company/ecoperform',
     ARRAY['EPC Certified', 'ESCO Europe Member'], ARRAY['CPE', 'audit énergétique', 'financement tiers', 'LED', 'CVC'],
     ARRAY['efficiency', 'solar', 'storage'],
     'pro', 2012, '11-50',
     TRUE, 81),

    -- 7. GreenTech
    (org_greentech, 'Voltify', 'voltify', 'greentech',
     'Startup deeptech développant des algorithmes d''optimisation de la flexibilité pour les micro-réseaux industriels. Lauréat Cleantech for Belgium 2023. Levée de fonds série A en cours.',
     'Deeptech — optimisation flexibilité micro-réseaux industriels',
     'BE', 'Bruxelles', 'Louvain-la-Neuve',
     'https://example.com', '+32 10 789 01 23', 'https://linkedin.com/company/voltify',
     ARRAY['Innoviris Grant', 'EIC Accelerator'], ARRAY['AI', 'flexibilité', 'micro-grid', 'deep tech', 'série A'],
     ARRAY['software', 'ai', 'storage', 'iot'],
     'pro', 2021, '1-10',
     TRUE, 73),

    -- 8. Admin
    (org_admin, 'EnergyHub Platform', 'energyhub-platform', 'greentech',
     'Compte administrateur de la plateforme EnergyHub.',
     'Admin interne EnergyHub',
     'BE', 'Bruxelles', 'Bruxelles',
     'https://energyhub.be', '+32 2 000 00 00', NULL,
     ARRAY[]::TEXT[], ARRAY['admin', 'platform']::TEXT[], ARRAY[]::TEXT[],
     'enterprise', 2023, '1-10',
     TRUE, 100);

  -- ─── 3. MEMBRES ──────────────────────────────────────────────────────────
  DELETE FROM members WHERE id IN (
    uid_industrial, uid_installer, uid_software, uid_investor,
    uid_energy, uid_esco, uid_greentech, uid_admin
  );

  INSERT INTO members (
    id, organization_id, first_name, last_name, email, job_title,
    is_org_admin, is_platform_admin,
    onboarding_completed, onboarding_step,
    notification_email, notification_rfq, language
  ) VALUES
    (uid_industrial, org_industrial, 'Marc',     'Dupont',     'test.industrial@energyhub.be', 'Directeur Énergie',        TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_installer,  org_installer,  'Julie',    'Maes',       'test.installer@energyhub.be',  'Responsable Commercial',   TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_software,   org_software,   'Thomas',   'Leroy',      'test.software@energyhub.be',   'CEO',                      TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_investor,   org_investor,   'Sophie',   'Vanderberg', 'test.investor@energyhub.be',   'Investment Manager',       TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_energy,     org_energy,     'Pierre',   'Collin',     'test.energy@energyhub.be',     'Key Account Manager B2B',  TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_esco,       org_esco,       'Nathalie', 'Simon',      'test.esco@energyhub.be',       'Ingénieure CPE',           TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_greentech,  org_greentech,  'Alexis',   'Bernard',    'test.greentech@energyhub.be',  'CTO & Co-founder',         TRUE, FALSE, TRUE, 3, TRUE, TRUE, 'fr'),
    (uid_admin,      org_admin,      'Admin',    'EnergyHub',  'admin@energyhub.be',           'Platform Administrator',   TRUE, TRUE,  TRUE, 3, TRUE, TRUE, 'fr');

  RAISE NOTICE '✅ 8 comptes de test créés avec succès.';
  RAISE NOTICE '';
  RAISE NOTICE '─── COMPTES DE TEST ───────────────────────────────────────';
  RAISE NOTICE 'Mot de passe universel : EnergyHub2024!';
  RAISE NOTICE '';
  RAISE NOTICE '  industrial     → test.industrial@energyhub.be  (Acier Wallon SA — Pro)';
  RAISE NOTICE '  installer      → test.installer@energyhub.be   (SolarTech Install — Pro)';
  RAISE NOTICE '  software_editor→ test.software@energyhub.be    (GridSense Software — Enterprise)';
  RAISE NOTICE '  investor       → test.investor@energyhub.be    (Green Capital Partners — Enterprise)';
  RAISE NOTICE '  energy_provider→ test.energy@energyhub.be      (Luminus Green — Pro)';
  RAISE NOTICE '  esco           → test.esco@energyhub.be        (EcoPerform Consulting — Pro)';
  RAISE NOTICE '  greentech      → test.greentech@energyhub.be   (Voltify — Pro)';
  RAISE NOTICE '  admin          → admin@energyhub.be            (EnergyHub Platform — Enterprise)';
  RAISE NOTICE '───────────────────────────────────────────────────────────';
END $$;
