# Hallucination Detection Logic

This document explains how the hallucination detection system works in the RadicAI Ad Agent.

## Overview

The hallucination detection system (`src/lib/metrics.ts`) checks whether the generated campaign plan contains information that wasn't in the original brief or knowledge base. It uses **rule-based heuristics** to identify potential hallucinations.

## Detection Factors

### 1. Product Features Invented

**What it checks:** Whether creatives mention product features that aren't in the brief.

**How it works:**
1. **Extract brief features**: Collects all `key_features` from the brief and normalizes them:
   - Splits features into individual words
   - Creates a set of all feature words and full phrases
   - Filters out very short words (< 3 chars)

2. **Define suspicious keywords**: A hardcoded list of feature-like terms that often indicate invented capabilities:
   ```typescript
   ['analytics', 'reporting', 'automation', 'ml', 'machine learning', 
    'encryption', 'backup', 'collaboration', 'real-time', 'sync']
   ```

3. **Check creatives**: For each creative (headline + body):
   - Search for suspicious keywords in the creative text
   - If found, check if the keyword or related words appear in the brief's feature set
   - If **not found** in brief features → flag as hallucination

4. **Allowlist**: Some keywords are allowed even if not in brief (general descriptors):
   ```typescript
   ['ai', 'cloud', 'secure', 'integration', 'offline', 'api']
   ```

**Example:**
- Brief features: `["AI-assisted task prioritization", "calendar integration"]`
- Creative mentions: `"advanced analytics dashboard"` 
- Result: ✅ Flagged (analytics not in brief)

**Penalty:** `+0.1` to hallucination score per suspicious keyword found

---

### 2. Invalid Channels

**What it checks:** Whether budget breakdown uses channels not in the allowed list.

**How it works:**
1. **Allowed channels**: `['search', 'social', 'display']`
2. **Check budget breakdown**: Iterate through all keys in `plan.budget_breakdown`
3. **Flag invalid channels**: If a channel isn't in the allowed list → flag as hallucination

**Example:**
- Plan has: `{ "search": 3000, "email": 2000 }`
- Result: ⚠️ Flagged (`email` is not allowed)

**Penalty:** `+0.1` to hallucination score per invalid channel

---

## Score Calculation

The **overall hallucination score** is a value between **0 and 1**:

```typescript
score = min(1, sum of all penalties)
```

**Score interpretation:**
- `0.0` = No hallucinations detected ✅
- `0.0 - 0.3` = Minor issues (minor feature mentions or edge cases)
- `0.3 - 0.7` = Moderate issues (several invented features or invalid channels)
- `0.7 - 1.0` = Major issues (significant hallucinations)

**Current penalties:**
- Product features invented: `+0.1` per suspicious keyword
- Invalid channels: `+0.1` per invalid channel

---

## Limitations & Design Decisions

### Why Rule-Based?

1. **No LLM needed**: Avoids the overhead of calling another model to check hallucinations
2. **Fast**: Rule-based checks are instantaneous
3. **Deterministic**: Same input always produces same result
4. **Explainable**: Clear logic for why something was flagged

### Known Limitations

1. **False positives**: 
   - Creative might use synonyms or related terms that aren't exact matches
   - Example: Brief says "task management" but creative says "project organization" → not detected as related
   
2. **Limited keyword list**:
   - Only checks for a hardcoded list of suspicious keywords
   - May miss other invented features if they use different terminology

3. **No semantic understanding**:
   - Doesn't understand that "AI-powered" and "machine learning" might mean the same thing
   - Requires exact word/phrase matching

4. **Price mismatch removed**:
   - Previously checked for price mismatches, but removed because:
     - KB validation (`validateAgainstKB`) handles price checks
     - Regex-based price detection had too many false positives (dates, percentages, etc.)

---

## Future Improvements

1. **Use embeddings for semantic matching**:
   - Compare creative text embeddings with brief feature embeddings
   - Would catch synonyms and related concepts

2. **LLM-based validation**:
   - Ask an LLM: "Does this creative mention features not in the brief?"
   - More accurate but slower and more expensive

3. **Learn from feedback**:
   - Track which flagged hallucinations were actually correct
   - Adjust keyword lists and thresholds based on real data

4. **Check against KB features**:
   - Also validate against retrieved knowledge base product facts
   - Ensures creatives only use verified features

---

## How to Interpret Results

When you see a hallucination score in the logs:

```
Hallucination Score: 20.0%
  - Features invented: YES ⚠️
  - Invalid channels: NO ✓
```

This means:
- The system detected some invented features (likely mentioned keywords like "analytics" or "automation" not in the brief)
- All channels are valid
- Overall score of 20% suggests minor issues

**Action items:**
- Review the flagged creatives manually
- Check if the "invented" features are actually just rewordings of brief features
- If truly invented, adjust the prompt to be more strict about using only brief/KB features

