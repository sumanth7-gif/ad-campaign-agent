Produce a campaign plan JSON for the following brief.

Required fields in the plan:
- campaign_id, campaign_name, objective
- total_budget, budget_breakdown by channel
- ad_groups: at least one, each with target and multiple creatives
- ad_groups must include a channel per group (one of: search, social, display)
- creatives: headline, body, cta, justification
- checks: budget_sum_ok, required_fields_present, channel_valid

Brief JSON:
{{brief}}

Schema hints:
- objective should map from the brief goal (e.g., "trial_signups")
- channels must be from {search, social, display}
- budget_breakdown must sum to total_budget
- targets can include age ranges and behaviors inferred from audience_hints

Note: If verified product facts or historical ad performance data are provided below, use them to ground your claims and inform creative strategy.

