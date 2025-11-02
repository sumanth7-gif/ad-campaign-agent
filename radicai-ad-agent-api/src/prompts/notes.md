Prompt design notes (approx. 250 words)

We use a concise system prompt to constrain behavior: produce only JSON, adhere to schema, and avoid external claims. The user prompt embeds the raw brief JSON and enumerates required fields and constraints (e.g., channel set, budget sum). This primes the model to plan structure-first, reducing undesired prose or omissions.

Known failure modes:
1) Schema drift: The model may rename fields or omit checks. We mitigate by enabling JSON response format and validating with Zod; failures are retried or surfaced.
2) Budget mismatch: The sum of channel budgets may not equal total. We add an explicit check and can patch minor rounding errors. We echo a boolean in checks.
3) Hallucinated features: The model may invent product details. The system prompt requires grounding only in the brief and reasonable defaults. We keep justifications short and non-factual.
4) Thin ad groups/creatives: The model may produce too few variants. The instruction requires multiple creatives per group; we validate length.

Validation:
- Input and output validated with Zod. Post-processing recomputes checks and updates booleans.
- Optional retries can add a corrective message if checks fail (not implemented in minimal version).

Future improvements:
- Constrained decoding with a formal schema.
- Retrieval grounding from a small KB of product facts.
- Heuristic scoring for creative variants and automated selection.

