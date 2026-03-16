-- ═══════════════════════════════════════════════════════════════════════════
-- ENERGYHUB — SEED PROJETS (RFQ) DE TEST
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
  uid_energy     UUID := 'a1000000-0000-0000-0000-000000000005';
  uid_esco       UUID := 'a1000000-0000-0000-0000-000000000006';
BEGIN

  -- Nettoyer les anciens seeds si re-run
  DELETE FROM rfqs WHERE organization_id IN (
    org_industrial, org_installer, org_software, org_energy, org_esco, org_greentech
  );

  INSERT INTO rfqs (
    organization_id, created_by, type, title, description, requirements,
    budget_range, deadline, location, status, published_at,
    target_actor_types, tags, responses_count
  ) VALUES

  -- 1. RFQ Solaire industriel
  (org_industrial, uid_industrial, 'rfq',
   'Installation panneaux solaires — Site industriel Liège',
   'Acier Wallon SA recherche un installateur certifié pour la mise en place d''une centrale photovoltaïque de 2 MWc sur les toitures de notre site de production à Liège. Le projet inclut la fourniture, l''installation et la mise en service complète du système, ainsi qu''un contrat de maintenance sur 10 ans.',
   'Puissance minimale : 2 MWc. Panneaux monocristallins ≥ 400 Wc. Onduleurs certifiés. Garantie système 25 ans. Référence projet similaire requise. Dossier de permis pris en charge par l''installateur.',
   '800 000 € – 1 200 000 €',
   NOW() + INTERVAL '45 days',
   'Liège, Wallonie',
   'published', NOW() - INTERVAL '3 days',
   ARRAY['installer'],
   ARRAY['solaire', 'toiture industrielle', 'PV', '2MWc', 'maintenance'],
   4),

  -- 2. RFI Logiciel EMS
  (org_industrial, uid_industrial, 'rfi',
   'Sélection logiciel EMS — Gestion énergie multi-sites',
   'Dans le cadre de notre programme de décarbonation, Acier Wallon SA lance un appel à informations pour identifier les solutions de gestion de l''énergie (EMS) adaptées à notre contexte multi-sites (3 usines, 450 GWh/an). Nous souhaitons évaluer les fonctionnalités, les coûts d''intégration et les références dans le secteur sidérurgique.',
   'Compatibilité SCADA existant (Siemens). API REST ouverte. Module demand response. Tableaux de bord temps réel. Support en français.',
   NULL,
   NOW() + INTERVAL '30 days',
   'Liège, Wallonie',
   'published', NOW() - INTERVAL '7 days',
   ARRAY['software_editor'],
   ARRAY['EMS', 'logiciel', 'multi-sites', 'SCADA', 'demand response'],
   2),

  -- 3. RFQ Audit énergétique
  (org_energy, uid_energy, 'rfq',
   'Audit énergétique + CPE — Parc tertiaire Namur',
   'Luminus Green mandate un ESCO pour la réalisation d''un audit énergétique approfondi et la proposition d''un contrat de performance énergétique sur un parc de bureaux de 12 000 m² à Namur. Budget annuel énergie actuel : 380 000 €. Objectif : réduction de 35% en 3 ans.',
   'Certification auditeur agréé SPW. Expérience CPE > 5 ans. Garantie d''économies contractuelle. Financement tiers accepté. Rapport ISO 50001 compatible.',
   '50 000 € – 120 000 € (audit + ingénierie)',
   NOW() + INTERVAL '21 days',
   'Namur, Wallonie',
   'responses_open', NOW() - INTERVAL '10 days',
   ARRAY['esco'],
   ARRAY['audit', 'CPE', 'tertiaire', 'performance', 'ISO 50001'],
   6),

  -- 4. RFP Fourniture énergie verte
  (org_esco, uid_esco, 'rfp',
   'RFP Fourniture électricité verte — Contrat 3 ans B2B',
   'EcoPerform Consulting lance un appel à propositions pour la fourniture d''électricité 100% renouvelable pour le compte de 8 clients industriels en Wallonie et Flandre. Volume annuel consolidé estimé : 28 GWh. Contrat-cadre 3 ans avec révision annuelle des prix.',
   'Garanties d''Origine certifiées. Prix fixe ou indexé (les deux options acceptées). Facturation mensuelle consolidée. Interlocuteur dédié. Réponse en moins de 10 jours ouvrés.',
   'Budget global : 2,8 M€/an (estimation)',
   NOW() + INTERVAL '14 days',
   'Wallonie & Flandre',
   'under_review', NOW() - INTERVAL '15 days',
   ARRAY['energy_provider'],
   ARRAY['électricité verte', 'PPA', 'B2B', 'garanties origine', 'contrat-cadre'],
   9),

  -- 5. RFQ Stockage énergie
  (org_installer, uid_installer, 'rfq',
   'Fourniture système BESS — Projet stockage 5 MWh Gand',
   'SolarTech Install recherche un fournisseur de systèmes de stockage par batteries (BESS) pour un projet client en Flandre. Capacité : 5 MWh / 2,5 MW. Technologie LFP préférée. Intégration avec centrale solaire existante de 3 MWc. Livraison sous 6 mois.',
   'Certification UL 9540. Garantie cycle minimale 10 ans / 4000 cycles. BMS intégré. Communication Modbus/MQTT. Service après-vente en Belgique.',
   '1 500 000 € – 2 500 000 €',
   NOW() + INTERVAL '60 days',
   'Gand, Flandre',
   'published', NOW() - INTERVAL '1 day',
   ARRAY['greentech', 'software_editor'],
   ARRAY['BESS', 'stockage', 'LFP', 'batteries', '5MWh', 'intégration solaire'],
   1),

  -- 6. RFI Hydrogène vert
  (org_greentech, uid_esco, 'rfi',
   'RFI — Partenaires projet hydrogène vert Wallonie',
   'Voltify explore les opportunités de développement d''un projet pilote de production et distribution d''hydrogène vert en Wallonie. Nous recherchons des partenaires industriels (offtakers), des fournisseurs d''électrolyseurs et des consultants spécialisés pour constituer un consortium.',
   'Capacité cible : 2 MW électrolyse. Offtake industriel minimum 500 kg H2/jour. Expérience projets H2 en Europe. Disponibilité pour réunion de consortium en mai.',
   NULL,
   NOW() + INTERVAL '90 days',
   'Wallonie, Belgique',
   'published', NOW() - INTERVAL '2 days',
   ARRAY['industrial', 'investor', 'energy_provider'],
   ARRAY['hydrogène', 'H2 vert', 'électrolyse', 'consortium', 'pilote'],
   3),

  -- 7. RFQ Recharge VE
  (org_energy, uid_energy, 'rfq',
   'Déploiement bornes de recharge VE — 50 sites Belgium',
   'Luminus Green déploie un réseau de bornes de recharge pour véhicules électriques sur 50 sites client en Belgique (entreprises, parkings, collectivités). Puissance par site : 2 à 8 bornes AC 22kW + 1 borne DC 150kW. Gestion via plateforme CPO centralisée.',
   'Certification OCPP 2.0.1. Interopérabilité eRoaming. Supervision à distance. Garantie 3 ans pièces + main d''œuvre. Expérience déploiement multi-sites requise.',
   '2 000 000 € – 3 500 000 €',
   NOW() + INTERVAL '35 days',
   'Belgique (national)',
   'published', NOW() - INTERVAL '5 days',
   ARRAY['installer', 'software_editor'],
   ARRAY['VE', 'recharge', 'OCPP', 'CPO', 'mobilité électrique', 'multi-sites'],
   7);

  RAISE NOTICE '✅ 7 projets RFQ/RFI/RFP créés avec succès.';
END $$;
