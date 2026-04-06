import { supabase } from "@/integrations/supabase/client";

/** Extract structured insights from an AI analyst response and save to ai_insights */
export async function extractAndSaveInsights(
  assistantContent: string,
  conversationId: string | null
) {
  const priorityActions = extractPriorityActions(assistantContent);
  const keyMetrics = extractKeyMetrics(assistantContent);
  const warnings = extractWarnings(assistantContent);
  const opportunities = extractOpportunities(assistantContent);
  const fullSummary = assistantContent.slice(0, 1500);

  const { error } = await supabase.from("ai_insights" as any).insert([
    {
      session_date: new Date().toISOString().split("T")[0],
      priority_actions: priorityActions,
      key_metrics: keyMetrics,
      warnings: warnings,
      opportunities: opportunities,
      full_summary: fullSummary,
      source_conversation_id: conversationId,
    },
  ]);

  if (error) {
    console.error("Failed to save insights:", error);
    return false;
  }
  return true;
}

function extractPriorityActions(text: string): string {
  // Look for numbered lists (1. 2. 3. etc.)
  const lines = text.split("\n");
  const actions: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      // Clean markdown bold/formatting
      actions.push(trimmed.replace(/\*\*/g, "").replace(/\*/g, ""));
    }
  }
  // Deduplicate and limit
  const unique = [...new Set(actions)];
  return unique.slice(0, 10).join("\n") || "";
}

function extractKeyMetrics(text: string): string {
  const lines = text.split("\n");
  const metrics: string[] = [];
  const metricPatterns = /(\$[\d,]+|\d+\.?\d*%|\bCAC\b|\bLTV\b|\bchurn\b|\bMRR\b|\bCPA\b|\bARPU\b|\bROAS\b)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && metricPatterns.test(trimmed)) {
      const clean = trimmed.replace(/\*\*/g, "").replace(/^\W+/, "").trim();
      if (clean.length > 5 && clean.length < 200) {
        metrics.push(clean);
      }
    }
  }
  // Deduplicate and limit
  const unique = [...new Set(metrics)];
  return unique.slice(0, 15).join(" | ") || "";
}

function extractWarnings(text: string): string {
  const lines = text.split("\n");
  const warnings: string[] = [];
  const warningPatterns = /\b(threat|risk|declining|worsening|critical|concern|danger|alert|warning|deteriorat|dropping|falling|negative)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && warningPatterns.test(trimmed)) {
      const clean = trimmed.replace(/\*\*/g, "").replace(/^\W+/, "").trim();
      if (clean.length > 10 && clean.length < 300) {
        warnings.push(clean);
      }
    }
  }
  const unique = [...new Set(warnings)];
  return unique.slice(0, 8).join("\n") || "";
}

function extractOpportunities(text: string): string {
  const lines = text.split("\n");
  const opps: string[] = [];
  const oppPatterns = /\b(opportunit|unlock|potential|migrate|upgrade|leverage|growth|upside|expand|scale|optimize|improve|increase)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && oppPatterns.test(trimmed)) {
      const clean = trimmed.replace(/\*\*/g, "").replace(/^\W+/, "").trim();
      if (clean.length > 10 && clean.length < 300) {
        opps.push(clean);
      }
    }
  }
  const unique = [...new Set(opps)];
  return unique.slice(0, 8).join("\n") || "";
}
