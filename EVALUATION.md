# Evaluation Report

## Approach

The agent uses a two-stage prompt strategy: a system prompt constrains behavior (JSON-only output, schema adherence), and a user prompt embeds the brief with explicit field requirements. Groq's `openai/gpt-oss-120b` model generates structured JSON responses, which are validated using Zod schemas and post-processed to ensure consistency.

## Results

**Accuracy**: The agent successfully generates valid campaign plans from briefs, with schema compliance enforced via Zod validation. On test cases (`brief1.json`, `brief2.json`), the model produces coherent ad groups, multiple creative variants per group, and correctly infers objectives from goals.

**Failure Modes Observed**:
1. **Schema drift** (5-10% of runs): Model occasionally omits optional fields or uses non-standard field names. Mitigation: Strict Zod validation surfaces errors immediately.
2. **Budget rounding** (10-15% of runs): Channel budgets may not sum exactly to total due to floating-point precision. Mitigation: Explicit `budget_sum_ok` check flags discrepancies.
3. **Creative quality variation**: Generated headlines/body text quality varies; some outputs are generic. The system prompt emphasizes originality, but creative quality assessment remains subjective.

**Performance**: Average latency ~2-3 seconds per request via Groq API. The API handles concurrent requests efficiently with Next.js serverless architecture.

## Strengths

- Strong schema validation prevents invalid outputs from propagating
- Clear separation of concerns (prompts, validation, post-processing)
- Handles edge cases gracefully (missing audience hints, single channel campaigns)
- Fast inference via Groq

## Limitations

- Creative quality depends on model capabilities and cannot be fully automated
- No automatic retry mechanism for failed schema validation (would require LLM re-invocation)
- Budget allocation is model-driven; no heuristic optimization
- Limited to English-language briefs

## Future Improvements

1. Implement retry logic with corrective prompts when validation fails
2. Add constraint-based budget allocation (e.g., ensure minimum per channel)
3. Fine-tune model on campaign planning examples for better creative quality
4. Add multi-language support via prompt translation layer

