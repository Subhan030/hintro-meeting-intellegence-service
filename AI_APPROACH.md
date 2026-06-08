# AI Approach

This document explains the AI design decisions, prompt engineering strategy, hallucination prevention approach, and known limitations of the Hintro Meeting Intelligence Service.

---

## Overview

Meeting analysis is powered by **Groq's inference API** using the `llama-3.3-70b-versatile` model. The service extracts four categories of insights from a meeting transcript:

1. **Summary** — Key points discussed
2. **Action Items** — Specific tasks assigned to people
3. **Decisions** — Decisions made during the meeting
4. **Follow-ups** — Recommended next steps

Every extracted insight is **grounded** to a specific transcript timestamp via citations.

---

## Prompt Design

### System Prompt Strategy

The system prompt is structured with explicit, numbered rules first — before any output format instructions. This ordering is intentional: LLMs attend more strongly to earlier content in the prompt, so grounding constraints are stated before the model is told what to produce.

```
CRITICAL RULES:
1. ONLY extract information explicitly stated in the transcript
2. DO NOT invent or assume any information
3. Every piece of information MUST include a citation with the timestamp
4. If you cannot find specific information, DO NOT include it
5. DO NOT make up attendee names, action items, or decisions
6. Extract timestamps in the format they appear in the transcript
```

### Why This Works

- **Instruction ordering:** Grounding rules appear before output format instructions so the model internalizes constraints first
- **Explicit prohibition language:** "DO NOT", "ONLY", "MUST" are high-signal instruction words that reduce ambiguous behavior
- **Empty array fallback:** The model is explicitly told `"If a section has no valid information, return an empty array"` — this prevents the model from hallucinating placeholder content to fill a section

### User Prompt

The user prompt passes the formatted transcript with a reinforcing reminder:

```
Remember: Only extract information explicitly stated in the transcript.
Every piece of information must include citations with timestamps.
Do not invent or assume anything.
```

The double-reinforcement (system + user) reduces the probability of the model ignoring grounding rules.

---

## Citation Strategy

Each insight object has a `citations` array containing `{ timestamp: string }` objects referencing the original transcript:

```json
{
  "text": "Team agreed to ship v2 by Friday",
  "citations": [{ "timestamp": "00:01" }]
}
```

**Implementation:**
1. The transcript is formatted as `[timestamp] Speaker: text` before being sent to the model
2. The model is instructed to include the exact timestamp string from the formatted transcript in citations
3. Citations are validated server-side before saving

This makes every AI insight **traceable and verifiable** — users can cross-reference any claim against the original transcript.

---

## Hallucination Prevention Approach

Three layers of protection:

### Layer 1: Prompt Constraints
- Explicit prohibition of invented information in the system prompt
- Reinforced in the user prompt
- Empty array instruction prevents placeholder hallucinations

### Layer 2: Low Temperature
```typescript
temperature: 0.3
```
Lower temperature reduces randomness/creativity, biasing the model toward factual extraction from provided context rather than generation.

### Layer 3: Server-side Validation (`validateAnalysis`)

After the model responds, a `validateAnalysis()` method enforces:

```typescript
// Every item in every section must have at least one citation
if (!item.citations || item.citations.length === 0) {
  throw new ApiError(500, "MISSING_CITATIONS", "All items must include citations");
}

// Every citation must have a timestamp
if (!citation.timestamp) {
  throw new ApiError(500, "INVALID_CITATION", "All citations must include a timestamp");
}
```

If the model produces any uncited insight, the entire analysis is rejected with a `500` error — ensuring no uncited content is saved to the database.

---

## Output Validation Strategy

| Check | Where | What |
|---|---|---|
| JSON structure | Groq API | `response_format: { type: "json_object" }` forces valid JSON |
| Schema shape | `validateAnalysis()` | All four sections must be arrays |
| Citation presence | `validateAnalysis()` | Every item must have `citations.length > 0` |
| Timestamp presence | `validateAnalysis()` | Every citation must have a `timestamp` field |
| Parse safety | `JSON.parse()` | Wrapped in try/catch, throws `ApiError` on parse failure |

---

## Model Configuration

```typescript
model: "llama-3.3-70b-versatile"
temperature: 0.3          // Low creativity, high factual grounding
max_tokens: 4000          // Sufficient for most meeting transcripts
response_format: { type: "json_object" }  // Enforces valid JSON output
```

**Why `llama-3.3-70b-versatile`:**
- 70B parameter model provides GPT-4-class instruction following
- The `versatile` variant is optimized for general tasks including structured extraction
- Groq's LPU hardware delivers sub-2 second inference even for this model size

---

## Known Limitations

### 1. Long Transcripts
- `max_tokens: 4000` for output + model context limits may cause truncation for very long meetings (2+ hours)
- **Mitigation:** Not implemented yet — chunked analysis would be needed for enterprise-scale transcripts

### 2. Timestamp Format Dependency
- Citation accuracy depends on the transcript using consistent, extractable timestamp formats (e.g., `00:10`, `01:25`)
- Free-form or missing timestamps reduce citation reliability

### 3. Hallucination Not Fully Eliminated
- The three-layer approach significantly reduces hallucinations but cannot eliminate them entirely
- A model may cite a real timestamp for a fabricated claim
- **Future improvement:** Cross-validate citation text against the actual transcript segment text

### 4. Rate Limits
- Groq free tier: ~30 requests/minute
- High-concurrency usage may hit `429 Too Many Requests` errors
- **Mitigation:** Not implemented — a request queue or retry with backoff would be needed for production scale

### 5. Single Language
- The prompt is in English; analysis quality degrades for non-English transcripts
- **Future improvement:** Detect transcript language and adapt the prompt accordingly

### 6. No Streaming
- The full analysis is returned in one response
- Large transcripts may cause Vercel's 10s function timeout
- **Mitigation:** Consider streaming or async job-based analysis for production

---

## Future Improvements

- [ ] Chunked analysis for transcripts exceeding context window
- [ ] Cross-validate cited timestamps against actual transcript text
- [ ] Per-user Telegram configuration (not global bot token)
- [ ] Streaming response support
- [ ] Multi-language transcript support
- [ ] Retry with exponential backoff on Groq rate limits
