# RadicAI Take-Home Assignment

## Project Structure

This folder contains the complete submission for the RadicAI Senior ML/GenAI Engineer take-home assignment.

### Folders

- **`radicai-ad-agent-api/`** - Next.js API backend
  - Converts ad brief JSON into structured campaign plans
  - Uses Groq for LLM inference
  - Zod schema validation
  - CORS-enabled API endpoint

- **`radicai-ad-agent-ui/`** - Next.js frontend UI
  - Form to input campaign brief JSON
  - Displays formatted campaign plan summary
  - Toggle between summary and raw JSON views

## Quick Start

### Backend API

```bash
cd radicai-ad-agent-api
npm install
# Create .env.local and add:
# GROQ_API_KEY=your_api_key_here
npm run dev
# Runs on http://localhost:3000
```

### Frontend UI

```bash
cd radicai-ad-agent-ui
npm install
npm run dev
# Runs on http://localhost:3000 (or 3001 if API is on 3000)
```

## Key Features

✅ **Groq Integration**: Fast LLM inference via Groq API  
✅ **Schema Validation**: Zod validation for input/output  
✅ **Consistency Checks**: Budget sums, required fields, channel validation  
✅ **Formatted Summary**: UI displays human-readable campaign summary  
✅ **JSON Export**: Toggle to view raw JSON for technical review  
✅ **Logging & Metrics**: Token counts, latency, hallucination detection  
✅ **Retrieval Grounding**: KB-based fact verification (TF-IDF + Jaccard similarity)  
✅ **Creative Scoring**: Rule-based heuristic ranks creatives by expected performance  
✅ **Docker Support**: Containerized deployment ready

