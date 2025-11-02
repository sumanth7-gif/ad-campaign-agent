import { z } from "zod";

export const BriefSchema = z.object({
  campaign_id: z.string().min(1),
  goal: z.string().min(1),
  product: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    key_features: z.array(z.string().min(1)).min(1),
    price: z.string().min(1)
  }),
  budget: z.number().positive(),
  channels: z.array(z.enum(["search", "social", "display"]).or(z.string())).min(1),
  audience_hints: z.array(z.string()).optional().default([]),
  tone: z.string().optional().default("neutral")
});

const CreativeSchema = z.object({
  id: z.string().min(1).optional(),
  headline: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  justification: z.string().min(1)
});

const AdGroupSchema = z.object({
  id: z.string().min(1).optional(),
  channel: z.enum(["search", "social", "display"]).optional(),
  target: z.record(z.any()),
  creatives: z.array(CreativeSchema).min(1)
});

export const PlanSchema = z.object({
  campaign_id: z.string().min(1),
  campaign_name: z.string().min(1),
  objective: z.enum(["trial_signups", "conversions", "awareness"]).or(z.string()),
  total_budget: z.number().nonnegative(),
  budget_breakdown: z.record(z.number().nonnegative()),
  ad_groups: z.array(AdGroupSchema).min(1),
  checks: z.object({
    budget_sum_ok: z.boolean(),
    required_fields_present: z.boolean(),
    channel_valid: z.boolean().optional().default(true)
  })
});

export type Brief = z.infer<typeof BriefSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export function sumBudget(budgetBreakdown: Record<string, number>): number {
  return Object.values(budgetBreakdown).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

export const AllowedChannels = new Set(["search", "social", "display"]);

