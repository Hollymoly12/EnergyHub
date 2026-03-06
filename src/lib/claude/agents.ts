// ═══════════════════════════════════════════════════════════════════════════
// ENERGYHUB — AGENTS CLAUDE
// 4 agents autonomes pour la gestion quotidienne de la plateforme
// ═══════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface AgentResult {
  success: boolean;
  output: Record<string, unknown>;
  tokensUsed: number;
  durationMs: number;
  error?: string;
}

// ─── HELPER: LOG AGENT EN BDD ────────────────────────────────────────────────

async function logAgent(params: {
  agentType: string;
  triggerEvent: string;
  organizationId?: string;
  memberId?: string;
  rfqId?: string;
  dealId?: string;
  inputData: Record<string, unknown>;
  result: AgentResult;
}) {
  const supabase = await createClient();
  await supabase.from("agent_logs").insert({
    agent_type: params.agentType,
    trigger_event: params.triggerEvent,
    organization_id: params.organizationId,
    member_id: params.memberId,
    rfq_id: params.rfqId,
    deal_id: params.dealId,
    input_data: params.inputData,
    output_data: params.result.output,
    tokens_used: params.result.tokensUsed,
    duration_ms: params.result.durationMs,
    success: params.result.success,
    error_message: params.result.error,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 1 — ONBOARDING
// Accueille les nouveaux acteurs, guide la complétion du profil
// ═══════════════════════════════════════════════════════════════════════════

export async function runOnboardingAgent(params: {
  organizationId: string;
  memberId: string;
  actorType: string;
  profileData: Record<string, unknown>;
  currentStep: number;
}): Promise<AgentResult> {
  const start = Date.now();

  const prompt = `Tu es l'agent d'onboarding d'EnergyHub, la marketplace B2B de la transition énergétique belge.

Un nouvel acteur vient de s'inscrire. Voici ses informations :
- Type d'acteur : ${params.actorType}
- Étape d'onboarding actuelle : ${params.currentStep}/5
- Données profil actuelles : ${JSON.stringify(params.profileData, null, 2)}

Ta mission :
1. Générer un message de bienvenue chaleureux et personnalisé selon le type d'acteur
2. Identifier les champs manquants les plus importants pour ce type d'acteur
3. Expliquer la valeur concrète de compléter chaque section
4. Proposer les 3 prochaines actions prioritaires

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{
  "welcome_message": "string (message de bienvenue personnalisé, 2-3 phrases)",
  "missing_fields": ["field1", "field2"],
  "next_actions": [
    {"action": "string", "reason": "string", "priority": 1}
  ],
  "completion_tips": "string (conseil pour ce type d'acteur spécifique)",
  "estimated_profile_score": number
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const output = JSON.parse(clean);

    const result: AgentResult = {
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      durationMs: Date.now() - start,
    };

    await logAgent({
      agentType: "onboarding",
      triggerEvent: "new_registration",
      organizationId: params.organizationId,
      memberId: params.memberId,
      inputData: params,
      result,
    });

    // Sauvegarder le message de bienvenue comme notification
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      member_id: params.memberId,
      type: "onboarding_welcome",
      title: "Bienvenue sur EnergyHub !",
      message: output.welcome_message,
      link: "/dashboard/profile",
    });

    return result;
  } catch (error) {
    const result: AgentResult = {
      success: false,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 2 — MATCHING
// Calcule les scores de compatibilité entre acteurs
// ═══════════════════════════════════════════════════════════════════════════

export async function runMatchingAgent(params: {
  sourceOrgId: string;
  sourceOrgData: Record<string, unknown>;
  candidateOrgs: Array<Record<string, unknown>>;
  context?: "rfq" | "networking" | "investment";
  rfqData?: Record<string, unknown>;
}): Promise<AgentResult> {
  const start = Date.now();

  const prompt = `Tu es l'agent de matching d'EnergyHub. Ton rôle est d'identifier les meilleures correspondances entre acteurs énergétiques belges.

Organisation source :
${JSON.stringify(params.sourceOrgData, null, 2)}

Contexte : ${params.context || "networking"}
${params.rfqData ? `RFQ associé : ${JSON.stringify(params.rfqData, null, 2)}` : ""}

Organisations candidates à évaluer :
${JSON.stringify(params.candidateOrgs, null, 2)}

Pour chaque organisation candidate, calcule :
1. Un score de compatibilité (0-100) basé sur : complémentarité des activités, localisation géographique, technologies communes, taille d'entreprise compatible, historique de collaboration potentiel
2. Les raisons principales du match
3. Les points de friction potentiels

Réponds UNIQUEMENT en JSON :
{
  "matches": [
    {
      "org_id": "string",
      "score": number,
      "match_reasons": ["reason1", "reason2"],
      "friction_points": ["point1"],
      "recommended_approach": "string (comment initier le contact)",
      "priority": "high|medium|low"
    }
  ],
  "top_recommendation": "string (analyse globale en 2 phrases)",
  "matching_insights": "string (tendances observées)"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const output = JSON.parse(clean);

    // Sauvegarder les matches en BDD
    const supabase = await createClient();
    if (output.matches && Array.isArray(output.matches)) {
      const matchInserts = output.matches
        .filter((m: { score: number }) => m.score >= 60) // Seuil minimum
        .map((m: { org_id: string; score: number; match_reasons: string[]; priority: string }) => ({
          source_org_id: params.sourceOrgId,
          target_org_id: m.org_id,
          rfq_id: params.rfqData?.id,
          match_score: m.score,
          match_reasons: m.match_reasons,
          match_criteria: { priority: m.priority },
        }));

      if (matchInserts.length > 0) {
        await supabase.from("matches").upsert(matchInserts, {
          onConflict: "source_org_id,target_org_id",
          ignoreDuplicates: false,
        });
      }
    }

    const result: AgentResult = {
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      durationMs: Date.now() - start,
    };

    await logAgent({
      agentType: "matching",
      triggerEvent: params.context || "networking",
      organizationId: params.sourceOrgId,
      inputData: { context: params.context, candidateCount: params.candidateOrgs.length },
      result,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 3 — RFI/RFQ ANALYSTE
// Analyse les RFQ, score les réponses, génère des synthèses
// ═══════════════════════════════════════════════════════════════════════════

export async function runRFQAgent(params: {
  rfqId: string;
  rfqData: Record<string, unknown>;
  responses?: Array<Record<string, unknown>>;
  task: "analyze_rfq" | "score_response" | "generate_summary";
  responseToScore?: Record<string, unknown>;
}): Promise<AgentResult> {
  const start = Date.now();

  let prompt = "";

  if (params.task === "analyze_rfq") {
    prompt = `Tu es l'agent RFQ d'EnergyHub. Analyse ce RFQ publié sur la marketplace.

RFQ :
${JSON.stringify(params.rfqData, null, 2)}

Ta mission :
1. Extraire et structurer les besoins clés
2. Identifier les acteurs idéaux à cibler
3. Détecter les ambiguïtés ou informations manquantes
4. Estimer la complexité et le budget probable
5. Suggérer des tags et technologies associés

Réponds UNIQUEMENT en JSON :
{
  "parsed_requirements": {
    "technical": ["req1", "req2"],
    "commercial": ["req1"],
    "timeline": "string",
    "budget_estimate": "string"
  },
  "ideal_actor_types": ["installer", "software_editor"],
  "ideal_technologies": ["tech1", "tech2"],
  "ambiguities": ["point1"],
  "complexity": "low|medium|high",
  "ai_summary": "string (résumé clair en 3 phrases pour les fournisseurs)",
  "suggested_tags": ["tag1", "tag2"],
  "urgency_score": number
}`;
  } else if (params.task === "score_response") {
    prompt = `Tu es l'agent RFQ d'EnergyHub. Évalue cette réponse à un appel d'offres.

RFQ original :
${JSON.stringify(params.rfqData, null, 2)}

Réponse à évaluer :
${JSON.stringify(params.responseToScore, null, 2)}

Score la réponse sur 100 selon ces critères pondérés :
- Adéquation technique (30%) : La réponse couvre-t-elle les besoins techniques ?
- Clarté et complétude (20%) : La proposition est-elle claire et complète ?
- Budget et délais (20%) : Cohérence avec les attentes ?
- Crédibilité du fournisseur (20%) : Références, certifications, expérience ?
- Qualité de rédaction (10%) : Professionnalisme du document ?

Réponds UNIQUEMENT en JSON :
{
  "total_score": number,
  "criteria_scores": {
    "technical_fit": number,
    "clarity": number,
    "budget_timeline": number,
    "credibility": number,
    "quality": number
  },
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1"],
  "red_flags": ["flag1"],
  "ai_summary": "string (synthèse pour l'acheteur en 3 phrases)",
  "recommendation": "strong_yes|yes|maybe|no"
}`;
  } else if (params.task === "generate_summary") {
    prompt = `Tu es l'agent RFQ d'EnergyHub. Génère une synthèse comparative des réponses reçues pour aider l'acheteur à décider.

RFQ :
${JSON.stringify(params.rfqData, null, 2)}

Réponses reçues (avec scores) :
${JSON.stringify(params.responses, null, 2)}

Génère une analyse comparative claire et actionnable.

Réponds UNIQUEMENT en JSON :
{
  "executive_summary": "string (synthèse en 4-5 phrases pour décideur)",
  "ranking": [
    {"org_id": "string", "org_name": "string", "rank": 1, "key_strength": "string"}
  ],
  "recommendation": "string (recommandation claire avec justification)",
  "next_steps": ["step1", "step2", "step3"],
  "negotiation_points": ["point1", "point2"]
}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const output = JSON.parse(clean);

    // Mettre à jour le RFQ en BDD avec les données AI
    const supabase = await createClient();
    if (params.task === "analyze_rfq") {
      await supabase.from("rfqs").update({
        ai_summary: output.ai_summary,
        ai_requirements_parsed: output,
        ai_matched_at: new Date().toISOString(),
      }).eq("id", params.rfqId);
    } else if (params.task === "score_response" && params.responseToScore?.id) {
      await supabase.from("rfq_responses").update({
        ai_score: output.total_score,
        ai_score_details: output.criteria_scores,
        ai_summary: output.ai_summary,
        ai_red_flags: output.red_flags,
      }).eq("id", params.responseToScore.id as string);
    }

    const result: AgentResult = {
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      durationMs: Date.now() - start,
    };

    await logAgent({
      agentType: "rfq_analysis",
      triggerEvent: params.task,
      rfqId: params.rfqId,
      inputData: { task: params.task },
      result,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT 4 — COMMUNICATION
// Génère et envoie emails, newsletters, alertes personnalisées
// ═══════════════════════════════════════════════════════════════════════════

export async function runCommunicationAgent(params: {
  type:
    | "rfq_alert"
    | "weekly_newsletter"
    | "match_notification"
    | "upgrade_nudge"
    | "deal_alert";
  recipientData: Record<string, unknown>;
  contextData: Record<string, unknown>;
}): Promise<AgentResult> {
  const start = Date.now();

  const typeDescriptions: Record<string, string> = {
    rfq_alert: "Alerte personnalisée : un nouveau RFQ correspond au profil du destinataire",
    weekly_newsletter: "Newsletter hebdomadaire résumant l'activité de la semaine sur EnergyHub",
    match_notification: "Notification : un nouveau match a été identifié pour cet acteur",
    upgrade_nudge: "Email de relance pour passer au plan Pro (sans être agressif)",
    deal_alert: "Alerte à un investisseur : un nouveau deal correspond à ses critères",
  };

  const prompt = `Tu es l'agent communication d'EnergyHub, la marketplace B2B de la transition énergétique belge.

Type de communication : ${params.type}
Description : ${typeDescriptions[params.type]}

Destinataire :
${JSON.stringify(params.recipientData, null, 2)}

Données contextuelles :
${JSON.stringify(params.contextData, null, 2)}

Génère un email professionnel, personnalisé et engageant en français.
Ton : professionnel mais accessible, focus sur la valeur concrète pour le destinataire.
Évite le jargon excessif. Sois direct et actionnable.

Réponds UNIQUEMENT en JSON :
{
  "subject": "string (objet email accrocheur, max 60 chars)",
  "preview_text": "string (texte de prévisualisation, max 90 chars)",
  "html_content": "string (HTML de l'email, utilise des balises simples)",
  "plain_text": "string (version texte brut)",
  "cta_text": "string (texte du bouton d'action principal)",
  "cta_url": "string (URL relative, ex: /rfq/xxx)",
  "personalization_score": number,
  "estimated_open_rate": number
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const output = JSON.parse(clean);

    const result: AgentResult = {
      success: true,
      output,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      durationMs: Date.now() - start,
    };

    await logAgent({
      agentType: "communication",
      triggerEvent: params.type,
      organizationId: params.recipientData.organization_id as string,
      memberId: params.recipientData.id as string,
      inputData: { type: params.type },
      result,
    });

    return result;
  } catch (error) {
    return {
      success: false,
      output: {},
      tokensUsed: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── ORCHESTRATEUR : PIPELINE COMPLET NOUVEAU RFQ ────────────────────────────
// Exemple d'orchestration : quand un RFQ est publié, enchaîner les agents

export async function orchestrateNewRFQ(rfqId: string) {
  const supabase = await createClient();

  // 1. Récupérer le RFQ
  const { data: rfq } = await supabase
    .from("rfqs")
    .select("*, organizations(*)")
    .eq("id", rfqId)
    .single();

  if (!rfq) return;

  // 2. Analyser le RFQ avec l'agent RFQ
  await runRFQAgent({
    rfqId,
    rfqData: rfq,
    task: "analyze_rfq",
  });

  // 3. Trouver des acteurs candidats pour le matching
  const { data: candidates } = await supabase
    .from("organizations")
    .select("*")
    .in("actor_type", rfq.target_actor_types || ["installer", "software_editor"])
    .eq("subscription_plan", "pro") // Notifier uniquement les Pro+
    .limit(50);

  if (candidates && candidates.length > 0) {
    // 4. Calculer les matches
    const matchResult = await runMatchingAgent({
      sourceOrgId: rfq.organization_id,
      sourceOrgData: rfq.organizations,
      candidateOrgs: candidates,
      context: "rfq",
      rfqData: rfq,
    });

    // 5. Notifier les top matches par email
    if (matchResult.success && matchResult.output.matches) {
      const topMatches = (matchResult.output.matches as Array<{ org_id: string; score: number }>)
        .filter((m) => m.score >= 75)
        .slice(0, 10);

      for (const match of topMatches) {
        const candidate = candidates.find((c) => c.id === match.org_id);
        if (!candidate) continue;

        // 6. Générer email personnalisé via agent communication
        await runCommunicationAgent({
          type: "rfq_alert",
          recipientData: candidate,
          contextData: { rfq, match_score: match.score },
        });
      }
    }
  }
}
