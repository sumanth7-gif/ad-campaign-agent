import { Brief, BriefSchema, Plan, PlanSchema, AllowedChannels, sumBudget } from "@/lib/schemas";
import { getGroqClient, chatJson } from "@/lib/groq";
import fs from "node:fs";
import path from "node:path";

function loadPrompt(relPath: string): string {
  const p = path.join(process.cwd(), "src", "prompts", relPath);
  return fs.readFileSync(p, "utf8");
}

const systemPrompt = loadPrompt("system.md");
const userPromptTemplate = loadPrompt("user.md");

function fillUserPrompt(brief: Brief): string {
  return userPromptTemplate.replace("{{brief}}", JSON.stringify(brief, null, 2));
}

export type AgentOptions = { modelId?: string };

export async function generatePlanFromBrief(briefInput: unknown, options: AgentOptions = {}): Promise<Plan> {
  const brief = BriefSchema.parse(briefInput);

  const client = getGroqClient();
  const content = await chatJson(client, [
    { role: "system", content: systemPrompt },
    { role: "user", content: fillUserPrompt(brief) }
  ], options.modelId);

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (e) {
    throw new Error("Model returned non-JSON content");
  }

  const parsed = PlanSchema.parse(raw);
  return finalizePlan(brief, parsed);
}

function inferObjective(goal: string): string {
  const g = goal.toLowerCase();
  if (g.includes("trial") || g.includes("signup")) return "trial_signups";
  if (g.includes("convert") || g.includes("purchase") || g.includes("sale")) return "conversions";
  return "awareness";
}

function splitBudget(total: number, channels: string[]): Record<string, number> {
  if (channels.length === 0) return {};
  const even = Math.floor((total / channels.length) * 100) / 100;
  const result: Record<string, number> = {};
  let allocated = 0;
  channels.forEach((c, i) => {
    const val = i === channels.length - 1 ? total - allocated : even;
    result[c] = Math.max(0, Math.round(val * 100) / 100);
    allocated += result[c];
  });
  return result;
}

function buildAdGroups(brief: Brief) {
  const hints = brief.audience_hints?.length ? brief.audience_hints : ["general productivity enthusiasts"];
  return hints.slice(0, 3).map((hint, idx) => ({
    id: `ag_${idx + 1}`,
    target: { hint, age: "25-45", behaviors: ["productivity apps", "remote work"] },
    creatives: [
      {
        id: `c_${idx + 1}a`,
        headline: `Try ${brief.product.name} — Free 14-Day Trial`,
        body: `${brief.product.name} helps you with ${brief.product.key_features[0]}. Start free today.`,
        cta: "Start Free Trial",
        justification: "Highlights trial and a key feature"
      },
      {
        id: `c_${idx + 1}b`,
        headline: `Focus More, Do More with ${brief.product.name}`,
        body: `AI-assisted prioritization that fits your calendar. ${brief.product.price}.`,
        cta: "Get Started",
        justification: "Emphasizes AI + price"
      }
    ]
  }));
}

function finalizePlan(brief: Brief, plan: Plan): Plan {
  const corrected = ensureIdsAndChannels({ ...plan }, brief);
  corrected.total_budget = brief.budget;
  const sum = sumBudget(corrected.budget_breakdown || {});
  // Do not mock or auto-heal budgets; surface check in flags
  const parsed = PlanSchema.parse(corrected);
  const checks = {
    budget_sum_ok: sumBudget(parsed.budget_breakdown) === brief.budget,
    required_fields_present: true,
    channel_valid: Object.keys(parsed.budget_breakdown).every(c => AllowedChannels.has(c))
  };
  return { ...parsed, checks };
}

function ensureIdsAndChannels(plan: Plan, brief: Brief): Plan {
  const out = { ...plan } as any;
  if (!out.ad_groups || !Array.isArray(out.ad_groups)) return plan;
  const channels: string[] = Array.isArray(brief.channels) && brief.channels.length > 0
    ? brief.channels.map(String)
    : Object.keys(out.budget_breakdown || {});
  out.ad_groups = out.ad_groups.map((ag: any, idx: number) => {
    const groupId = ag.id || `ag_${idx + 1}`;
    const channel = ag.channel || (channels.length ? channels[idx % channels.length] : undefined);
    const creatives = Array.isArray(ag.creatives) ? ag.creatives.map((c: any, j: number) => ({
      id: c?.id || `c_${idx + 1}${String.fromCharCode(97 + j)}`,
      headline: c?.headline,
      body: c?.body,
      cta: c?.cta,
      justification: c?.justification
    })) : [];
    return { ...ag, id: groupId, channel, creatives };
  });
  return out as Plan;
}

