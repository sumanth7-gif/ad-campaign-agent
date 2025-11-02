# RadicAI Ad Agent UI

Minimal Next.js UI to submit an ad brief and display the generated campaign plan.

## Setup

- Node 18+
- Install deps: `npm install`
- Env vars:
  - `NEXT_PUBLIC_API_BASE` (optional, defaults to `http://localhost:3000`)

## Run

- Dev: `npm run dev` (default port 3000, auto-increments if port is taken)
- Paste brief JSON and click Generate Plan.

**Note**: If you run both API and UI simultaneously, Next.js will automatically use the next available port (3001) for the second one. Make sure `NEXT_PUBLIC_API_BASE` points to the correct API port.
