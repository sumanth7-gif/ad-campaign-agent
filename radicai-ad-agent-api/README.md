# RadicAI Ad Agent API

Minimal Next.js API that converts an ad brief JSON into a structured campaign plan using Groq and Zod validation.

## Setup

- Node 18+
- Install deps: `npm install`

## Environment Variables

- `GROQ_API_KEY` (required)
- `GROQ_MODEL` (optional, default: `openai/gpt-oss-120b`)

## Run

### Development
```bash
npm run dev
# Runs on http://localhost:3000
```

### Docker

Build the Docker image:
```bash
docker build -t radicai-ad-agent-api .
```

Run the container:
```bash
docker run -p 3000:3000 --env-file .env.local radicai-ad-agent-api
```

The API will be available at `http://localhost:3000`.

**Note:** Make sure you have a `.env.local` file with `GROQ_API_KEY` set.

### API Endpoint

- **Endpoint**: `POST /api/chat/completions`
- **Body**: brief JSON
- **Query params**: `?include_metrics=true` to include metrics in response

## Example

```bash
curl -s -X POST "http://localhost:3000/api/chat/completions" \
  -H 'Content-Type: application/json' \
  -d @examples/brief1.json | jq .
```

## Tests

```bash
npm run test
```

## Logging & Metrics

The API automatically logs request metrics to console (JSON format) for each request:

- **Token counts**: prompt tokens, completion tokens, and total tokens
- **Latency**: request processing time in milliseconds
- **Hallucination detection**: flags for:
  - Product features invented (not in brief or KB)
  - Invalid channels
  - Overall hallucination score (0-1)
- **Validation errors**: any schema or budget validation issues

Example log output:
```json
{
  "type": "request_metrics",
  "campaignId": "cmp_2025_09_01",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "tokens": {
    "prompt": 450,
    "completion": 320,
    "total": 770
  },
  "latency": 2150,
  "hallucinationFlags": {
    "productFeaturesInvented": false,
    "invalidChannels": false,
    "score": 0
  },
  "validationErrors": []
}
```

To include metrics in API response (for debugging), add `?include_metrics=true` query parameter.

## Retrieval Grounding

The agent uses a knowledge base (`src/lib/knowledge-base.json`) to ground claims and improve accuracy:

- **Product Facts**: Verified product features, prices, descriptions, and key benefits
- **Historical Ad Metrics**: Past campaign performance data (CTR, conversion rates) to inform creative strategy

### Retrieval Algorithm

Product matching uses **TF-IDF + Jaccard similarity** for semantic retrieval:

1. **Exact match**: Returns immediately if product name matches exactly
2. **TF-IDF scoring**: Calculates term frequency × inverse document frequency across KB
3. **Jaccard similarity**: Measures word overlap between query and products
4. **Combined scoring**: Weighted combination (70% TF-IDF + 30% Jaccard)
5. **Boosting**: Additional points for name/category matches
6. **Ranking**: Returns best match above similarity threshold (0.1)

This approach enables semantic matching (e.g., "task manager" → FocusFlow) without requiring external embedding APIs.

When generating a plan:
1. Agent searches KB for matching product facts using similarity scoring
2. Retrieves relevant historical ad metrics based on product category and channels
3. Includes retrieved context in the prompt to guide generation
4. Validates generated plan against KB facts (price matching, feature verification)

This reduces hallucinations by ensuring the agent uses verified facts rather than inventing details.

To add new products or metrics, edit `src/lib/knowledge-base.json`.

## Creative Performance Scoring

The agent automatically scores and ranks creatives by expected relative performance using a rule-based heuristic (`src/lib/scoring.ts`).

### Scoring Factors (0-100 total)

1. **Keyword Match (0-40 points)**: How well the creative matches successful headline keywords from historical ad metrics
2. **Headline Type Match (0-20 points)**: Alignment with proven headline types (trial-focused, feature-focused, benefit-focused, etc.)
3. **Best Practices (0-25 points)**: 
   - Action verbs ("try", "get", "start")
   - Numbers and urgency words
   - Quality CTA
   - Appropriate length (headline 20-60 chars, body 50-200 chars)
   - Clear value proposition
4. **Channel Performance (0-15 points)**: Baseline score based on historical performance for the channel

### Scoring Output

Each creative in the plan includes:
- `relative_score`: Performance score (0-100)
- `performance_rank`: Ranking among all creatives (1 = best)
- `score_factors`: Breakdown of scoring components

Creatives are automatically sorted by score (highest first). Higher scores indicate better expected performance based on historical data.

## Notes
- Input and output validated with Zod.
- If the LLM response is not valid JSON or schema-conformant, the API returns a 400 with an error message.
- All requests are logged with metrics to console (structured JSON).
- Retrieval grounding is automatic when product matches are found in the knowledge base.
