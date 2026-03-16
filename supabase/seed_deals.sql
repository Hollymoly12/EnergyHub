-- ═══════════════════════════════════════════════════════════════════════════
-- ENERGYHUB — SEED DEALS / LEVÉES DE FONDS DE TEST
-- Exécuter après seed_test_accounts.sql
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  org_industrial UUID := 'b1000000-0000-0000-0000-000000000001';
  org_installer  UUID := 'b1000000-0000-0000-0000-000000000002';
  org_software   UUID := 'b1000000-0000-0000-0000-000000000003';
  org_energy     UUID := 'b1000000-0000-0000-0000-000000000005';
  org_esco       UUID := 'b1000000-0000-0000-0000-000000000006';
  org_greentech  UUID := 'b1000000-0000-0000-0000-000000000007';

  uid_industrial UUID := 'a1000000-0000-0000-0000-000000000001';
  uid_installer  UUID := 'a1000000-0000-0000-0000-000000000002';
  uid_software   UUID := 'a1000000-0000-0000-0000-000000000003';
  uid_energy     UUID := 'a1000000-0000-0000-0000-000000000005';
  uid_esco       UUID := 'a1000000-0000-0000-0000-000000000006';
  uid_greentech  UUID := 'a1000000-0000-0000-0000-000000000007';
BEGIN

  DELETE FROM deals WHERE organization_id IN (
    org_industrial, org_installer, org_software,
    org_energy, org_esco, org_greentech
  );

  INSERT INTO deals (
    organization_id, created_by,
    title, description, project_type, location, capacity_mw,
    funding_amount, funding_type, series, irr_target, duration_years,
    current_investors,
    status, published_at, requires_nda,
    interests_count, ai_score,
    ai_summary
  ) VALUES

  -- 1. Levée série A — GreenTech IA
  (org_greentech, uid_greentech,
   'Voltify — Série A 4 M€ — Optimisation flexibilité industrielle',
   'Voltify développe des algorithmes d''IA pour optimiser la flexibilité énergétique des micro-réseaux industriels. Après 18 mois de R&D et 3 pilotes clients validés (économies moyennes : 22%), nous levons 4 M€ en série A pour accélérer notre go-to-market en Belgique, Pays-Bas et Allemagne. MRR actuel : 85 000 €, objectif 500 000 € MRR en 24 mois.',
   'other', 'Louvain-la-Neuve, Belgique', NULL,
   4000000, 'equity', 'series-a', NULL, NULL,
   'Innoviris (300k€), BNP Paribas Fortis Venture (500k€)',
   'published', NOW() - INTERVAL '5 days', FALSE,
   8, 87,
   'Startup deeptech à fort potentiel sur un marché en croissance rapide. Traction commerciale validée, équipe technique solide. Risque principal : intensité concurrentielle des grands éditeurs EMS. Ratio risk/reward attractif pour un fonds early-stage.'),

  -- 2. Dette infrastructure — Parc solaire
  (org_installer, uid_installer,
   'Financement dette — Parc solaire 8 MWc Flandre',
   'SolarTech Install porte le développement d''un parc solaire au sol de 8 MWc en Flandre, avec permis accordé et contrat PPA signé sur 15 ans avec un industriel local. Nous recherchons un financement par dette senior de 6 M€ pour couvrir 75% du CAPEX. Les 25% restants sont apportés en fonds propres par nos actionnaires. Rendement garanti par le PPA.',
   'solar', 'Gand, Flandre', 8.0,
   6000000, 'debt', NULL, 6.50, 15,
   'Actionnaires fondateurs (1,5 M€ equity)',
   'published', NOW() - INTERVAL '8 days', TRUE,
   5, 92,
   'Profil de risque très faible grâce au PPA long terme avec contrepartie investment-grade. IRR dette de 6,5% net. Structure classique project finance. Recommandé pour fonds infrastructure cherchant rendement stable et prévisible.'),

  -- 3. Equity — Efficacité énergétique ESCO
  (org_esco, uid_esco,
   'EcoPerform — Levée 2,5 M€ pour scale CPE B2B',
   'EcoPerform Consulting cherche 2,5 M€ en equity pour financer son pipeline de contrats de performance énergétique (CPE). Nous avons 12 M€ de CPE signés en attente de financement. Le modèle : nous finançons les travaux, l''économie d''énergie garantie rembourse sur 10-12 ans. ROI moyen portefeuille : 14% net. Ticket minimum investisseur : 250 000 €.',
   'efficiency', 'Anvers, Flandre', NULL,
   2500000, 'equity', 'seed', 14.00, 10,
   NULL,
   'published', NOW() - INTERVAL '3 days', TRUE,
   3, 78,
   'Modèle ESCO avec revenus récurrents et risque limité par les garanties contractuelles. Pipeline solide de 12 M€. Principal risque : exécution opérationnelle des chantiers. Attractif pour investisseurs cherchant impact mesurable (réduction CO2 certifiée).'),

  -- 4. Convertible — SaaS EMS
  (org_software, uid_software,
   'GridSense — Note convertible 1,5 M€ — Bridge série B',
   'GridSense Software lève 1,5 M€ en note convertible pour financer 12 mois de croissance avant notre série B prévue en Q1 2026. ARR actuel : 2,1 M€ (+65% YoY), NRR : 118%. Nos 200+ clients industriels représentent un potentiel d''upsell de 8 M€ ARR. Note convertible avec discount de 20% sur la série B et cap à 15 M€ de valorisation.',
   'other', 'Bruxelles, Belgique', NULL,
   1500000, 'convertible', 'bridge', NULL, NULL,
   'Sofina (lead série A, 3 M€), Capricorn Venture Partners',
   'published', NOW() - INTERVAL '12 days', FALSE,
   11, 94,
   'SaaS B2B à forte rétention avec métriques de croissance excellentes. Note convertible avec conditions investisseur-friendly. Risque limité par la qualité du cap table existant. Opportunité de co-investir aux côtés de Sofina avant la série B.'),

  -- 5. Equity — Hydrogène vert
  (org_greentech, uid_greentech,
   'Projet H2 Vert Wallonie — Co-investissement 8 M€',
   'Voltify co-développe avec des partenaires industriels un projet pilote de production d''hydrogène vert en Wallonie (électrolyse PEM 2 MW alimentée par éolien). Nous cherchons des co-investisseurs pour constituer le tour de table de 8 M€ (subventions : 3 M€ accordées, equity cherché : 5 M€). Offtake sécurisé avec un industriel chimique pour 10 ans.',
   'hydrogen', 'Charleroi, Wallonie', 2.0,
   5000000, 'equity', NULL, 11.50, 20,
   'Région Wallonne (3 M€ subvention), SPAQuE',
   'published', NOW() - INTERVAL '2 days', TRUE,
   4, 81,
   'Projet pionnier H2 vert en Belgique avec soutien public fort. IRR de 11,5% sur 20 ans. Risque technologique modéré (électrolyse PEM mature). Éligible aux fonds Article 9 SFDR. Ideal pour investisseurs avec horizon long terme et conviction sur la filière hydrogène.'),

  -- 6. Dette — Stockage batteries
  (org_energy, uid_energy,
   'BESS 10 MWh Namur — Project Finance 7 M€',
   'Luminus Green développe un système de stockage par batteries de 10 MWh / 5 MW à Namur, couplé à un contrat de services système avec Elia (aFRR). Revenus annuels estimés : 950 000 €. Nous recherchons un financement project finance de 7 M€ sur 12 ans. DSCR minimum : 1,35x. Technologie LFP avec garantie constructeur 12 ans.',
   'storage', 'Namur, Wallonie', 5.0,
   7000000, 'debt', NULL, 7.20, 12,
   'Luminus Green (equity 30%, 3 M€)',
   'published', NOW() - INTERVAL '6 days', TRUE,
   6, 89,
   'Actif de stockage avec revenus sécurisés via contrat Elia. Structure project finance classique avec DSCR confortable. Technologie LFP éprouvée. IRR dette 7,2% attractif dans le contexte actuel. Risque principal : volatilité des prix des services système, partiellement couvert par le contrat aFRR.'),

  -- 7. Equity — Scale-up installateur
  (org_installer, uid_installer,
   'SolarTech Install — Growth equity 3 M€ pour expansion B2B',
   'SolarTech Install, leader de l''installation PV industrielle en Belgique, lève 3 M€ en growth equity pour financer son expansion commerciale (recrutement 15 commerciaux, ouverture antenne Wallonie) et acquérir un concurrent flamand avec 8 M€ de CA. CA 2024 : 14 M€, EBITDA : 18%. Objectif CA 2027 : 35 M€.',
   'solar', 'Gand, Flandre', NULL,
   3000000, 'equity', 'growth', 18.00, 5,
   'Fondateurs (100% actuellement)',
   'published', NOW() - INTERVAL '9 days', FALSE,
   9, 83,
   'PME profitable avec position de marché solide. Levée pour financer croissance organique et acquisition ciblée. EBITDA de 18% offre une bonne visibilité sur le remboursement. Valorisation raisonnable à 6x EBITDA. Adapté aux fonds PME/growth à horizon 5 ans.');

  RAISE NOTICE '✅ 7 deals créés avec succès.';
END $$;
