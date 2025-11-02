# RadicAI Ad Agent API

Minimal Next.js API that converts an ad brief JSON into a structured campaign plan using LLM providers (Groq or OpenAI) and Zod validation.

## Setup

- Node 18+
- Install deps: `npm install`

## Environment Variables

### Provider Selection
Set `LLM_PROVIDER=groq` (default) or `LLM_PROVIDER=openai`

### Groq (Default)
- `GROQ_API_KEY` (required if using Groq)
- `GROQ_MODEL` (optional, default: `openai/gpt-oss-120b`)

### OpenAI
- `OPENAI_API_KEY` (required if using OpenAI)
- `OPENAI_MODEL` (optional, default: `gpt-4o-mini`)

**Note**: You only need to set the API key for your chosen provider. The system will automatically detect which provider to use based on available keys.

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
