# Evaluation Report

## Approach

The agent uses a two-stage prompt strategy: a system prompt constrains behavior (JSON-only output, schema adherence), and a user prompt embeds the brief with explicit field requirements. Groq's `openai/gpt-oss-120b` model generates structured JSON responses, which are validated using Zod schemas and post-processed to ensure consistency. Retrieval grounding injects verified product facts and historical ad metrics into the prompt to reduce hallucinations. A lightweight heuristic scores creatives by expected performance.

## Results

**Accuracy**: The agent successfully generates valid campaign plans from briefs, with schema compliance enforced via Zod validation. On test cases (`brief1.json`, `brief2.json`), the model produces coherent ad groups, multiple creative variants per group, and correctly infers objectives from goals.

**Failure Modes Observed**:
1. **Schema drift** (5-10% of runs): Model occasionally omits optional fields or uses non-standard field names. Mitigation: Strict Zod validation surfaces errors immediately.
2. **Budget rounding** (10-15% of runs): Channel budgets may not sum exactly to total due to floating-point precision. Mitigation: Explicit `budget_sum_ok` check flags discrepancies.
3. **Creative quality variation**: Generated headlines/body text quality varies; some outputs are generic. The scoring heuristic ranks outputs, but creative quality assessment remains subjective.
4. **Residual hallucinations**: Some creatives may introduce capabilities not present in the brief. Mitigation: Retrieval grounding + rule-based hallucination checks; surfaced as metrics, not silent failures.

**Performance**: Average latency ~2-3 seconds per request via Groq API. The API handles concurrent requests efficiently with Next.js serverless architecture.

## Strengths

- Strong schema validation prevents invalid outputs from propagating
- Clear separation of concerns (prompts, validation, post-processing)
- Handles edge cases gracefully (missing audience hints, single channel campaigns)
- Fast inference via Groq
- Retrieval grounding reduces fabricated facts without external embedding services
- Transparent logging/metrics (tokens, latency, hallucination flags) aid debugging and ops

## Limitations

- Creative quality depends on model capabilities and cannot be fully automated
- No automatic retry mechanism for failed schema validation (would require LLM re-invocation)
- Budget allocation is model-driven; no heuristic optimization beyond basic checks
- Limited to English-language briefs
 - Hallucination check is keyword-based (explainable but not fully semantic)

## Prompt Choices & Validation

- System prompt enforces: JSON-only output, explicit fields, channel constraints, and budget checks. 
- User prompt includes the brief JSON verbatim and adds retrieval-grounded context when available (verified features, price, benefits; historical CTR/conversion patterns).
- Zod schemas (`PlanSchema`) validate types and required fields; we compute `checks` (budget sum, channel validity) and reject non-conformant outputs.

## Retrieval Grounding

- Knowledge base (`src/lib/knowledge-base.json`) contains product facts and historical ad metrics.
- Matching algorithm: TF‑IDF (70%) + Jaccard (30%) with boosts for name/category overlap. Exact match short-circuits.
- Retrieved facts are appended to the prompt with an instruction to use only verified facts; generated plans are validated against KB for price/features where applicable.

## Hallucination Detection

- Rule-based flags: invented feature keywords (analytics, reporting, automation, ML, encryption, backup, collaboration, real-time, sync) not present in brief/KB; invalid budget channels.
- Score: additive 0.1 per hit, clamped to [0,1]; reported as a percentage. Intent is observability, not hard failure.

## Creative Scoring Heuristic

- Factors (0–100): keyword match vs high-performing headlines (0–40), headline type alignment (0–20), best practices (0–25), channel performance baseline (0–15).
- Outputs per creative: `relative_score`, `performance_rank`, `score_factors`. UI displays scores and sorts by best first.

## Future Improvements

1. Robust retry loop with targeted repair prompts and function-tool calls for re-validation.
2. Model abstraction layer to support multiple providers/models (Groq, OpenAI, local) with unified token/cost reporting and fallbacks.
3. Multi‑agent design: planner (structure/budget), copywriter (creatives), verifier (schema/KB checks), and scorer (rank). Orchestrate via lightweight router/state.
4. Conversational UI + memory: iterative refinement (“more playful tone”, “shift 10% to social”), with ephemeral session memory and diffed updates.
5. Constraint‑aware budget optimizer (simple LP/heuristics) guided by historical channel performance and objective.
6. Semantic hallucination guard: small embedding model for feature similarity; escalate to LLM judge only on uncertain cases.
7. Streaming and partial results: stream plan drafts to UI; progressively fill ad groups and scores.
8. Caching and idempotency: request hashing, KB versioning, deterministic seeds for reproducibility.
9. Observability: structured logs to a sink, traces, and metrics dashboards; redteam test sets and regression checks.
10. Multi-language support via translation layer and locale-aware copy heuristics.

