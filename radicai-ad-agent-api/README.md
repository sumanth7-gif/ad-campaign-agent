# RadicAI Ad Agent API

Minimal Next.js API that converts an ad brief JSON into a structured campaign plan using Groq and Zod validation.

## Setup

- Node 18+
- Install deps: `npm install`

## Environment Variables

- `GROQ_API_KEY` (required)
- `GROQ_MODEL` (optional, default: `openai/gpt-oss-120b`)

## Run

- Dev: `npm run dev` (default port 3000)
- Endpoint: `POST /api/chat/completions`
  - Body: brief JSON

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

## Notes
- Input and output validated with Zod.
- If the LLM response is not valid JSON or schema-conformant, the API returns a 400 with an error message.
