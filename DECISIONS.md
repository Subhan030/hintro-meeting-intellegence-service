# Technical Decisions

This document captures the key architectural and technical decisions made during the development of Hintro Meeting Intelligence Service, along with the reasoning, alternatives considered, and trade-offs.

---

## 1. Database: MongoDB (Mongoose)

**Decision:** Use MongoDB as the primary database via Mongoose ODM.

**Why chosen:**
- Meeting transcripts are deeply nested, variable-length arrays — MongoDB's document model stores them natively without joins or schema migrations
- Flexible schema allows AI analysis results (summary, action items, decisions, follow-ups) to be embedded directly in the meeting document
- Mongoose provides TypeScript-friendly schemas with validation and middleware hooks

**Alternatives considered:**
- **PostgreSQL** — Strong ACID guarantees but requires separate tables for transcript segments, analysis results, and action items with complex joins
- **DynamoDB** — Good for serverless scaling but complex query patterns and higher operational overhead for relational-style lookups

**Trade-offs:**
- ✅ Schema flexibility, embedded documents, fast reads
- ❌ No multi-document ACID transactions (not required here)
- ❌ Slightly higher memory usage on Vercel cold starts (mitigated by connection caching)

---

## 2. Authentication Strategy: JWT (Stateless)

**Decision:** Use JSON Web Tokens (JWT) with bcrypt password hashing for stateless authentication.

**Why chosen:**
- Stateless — no session store needed, scales horizontally across serverless functions without sticky sessions
- Vercel serverless functions are ephemeral; session-based auth would require Redis or a session DB per request
- Industry standard for REST API auth, well-supported in Node.js ecosystem

**Alternatives considered:**
- **Session-based auth (express-session)** — Requires persistent session store (e.g., Redis), incompatible with stateless serverless
- **OAuth2 / Passport.js** — Overkill for this service; no social login requirement
- **API Keys** — Simpler but no user identity or expiry mechanism

**Trade-offs:**
- ✅ Stateless, serverless-friendly, self-contained tokens
- ❌ Tokens cannot be revoked before expiry (would need a blocklist/Redis to fix)
- ❌ Larger request payload vs. session cookies

---

## 3. AI Provider: Groq (LLaMA 3.3 70B)

**Decision:** Use Groq's inference API with the `llama-3.3-70b-versatile` model.

**Why chosen:**
- **Speed** — Groq's LPU hardware delivers extremely low latency (~1-2s for 4000 token outputs vs. 8-15s on standard GPU endpoints)
- **JSON mode** — Native `response_format: { type: "json_object" }` ensures structured, parseable output
- **Cost** — Significantly cheaper than OpenAI GPT-4 at this scale
- **Quality** — LLaMA 3.3 70B performs comparably to GPT-4o on structured extraction tasks

**Alternatives considered:**
- **OpenAI GPT-4o** — Higher quality but slower and more expensive; JSON mode available
- **Anthropic Claude** — Excellent at following instructions but no native JSON mode at time of decision
- **Google Gemini** — Available via `@google/genai` (included as dependency) but Groq's latency was significantly better

**Trade-offs:**
- ✅ Fast, cheap, structured JSON output
- ❌ LLaMA 3.3 occasionally less reliable than GPT-4o on edge cases
- ❌ Rate limits on free tier (429 errors under heavy load)

---

## 4. Third-party Integration: Telegram Bot API

**Decision:** Use Telegram Bot API (`node-telegram-bot-api`) for reminder notifications.

**Why chosen:**
- Free, no per-message cost
- Telegram's Bot API is simple — send a message with a single HTTP POST
- Widely used, reliable delivery
- Users can receive rich formatted messages (Markdown support)

**Alternatives considered:**
- **Email (Nodemailer/SendGrid)** — Reliable but slower delivery, spam filter risk, requires email provider setup
- **WhatsApp Business API** — Better reach but expensive, requires business verification
- **Slack API** — Excellent for team tools but assumes users are on Slack

**Trade-offs:**
- ✅ Free, instant delivery, easy setup
- ❌ Requires user to have Telegram and know their chat ID
- ❌ Single chat ID configured per deployment (not per-user)

---

## 5. Reminder Scheduling: node-cron

**Decision:** Use `node-cron` for the hourly overdue reminder job.

**Why chosen:**
- Lightweight, no external dependencies
- Simple cron expression syntax (`0 * * * *` for hourly)
- Sufficient for the hourly polling requirement

**Alternatives considered:**
- **Bull/BullMQ (Redis-backed queues)** — Much more powerful (retry, delay, priority) but requires Redis infrastructure
- **Agenda (MongoDB-backed)** — Good fit since MongoDB is already in use, but added complexity for a simple hourly job
- **Vercel Cron Jobs** — Free tier allows cron but minimum interval is 1 day on free plan

**Trade-offs:**
- ✅ Zero infrastructure, works in any Node.js process
- ❌ Does not run on Vercel serverless (guarded by `VERCEL !== "1"`)
- ❌ Job state is in-memory — restarts reset the schedule (acceptable for hourly reminders)

---

## 6. API Framework: Express 5

**Decision:** Use Express 5 (latest major release).

**Why chosen:**
- Express 5 has native async/await error propagation — `async` route handlers automatically forward thrown errors to error middleware without needing `try/catch` wrappers everywhere
- Most familiar Node.js web framework with the largest ecosystem
- Lightweight, minimal opinion on structure

**Alternatives considered:**
- **Fastify** — Faster throughput and built-in schema validation, but less familiar ecosystem
- **Hono** — Excellent for edge/serverless, but smaller community
- **NestJS** — Full-featured but heavyweight for this scope

**Trade-offs:**
- ✅ Familiar, vast ecosystem, async error handling in v5
- ❌ Slightly slower than Fastify for raw throughput
- ❌ No built-in request validation (mitigated by Zod)

---

## 7. Input Validation: Zod

**Decision:** Use Zod for request body validation.

**Why chosen:**
- TypeScript-first — schemas generate types automatically, no duplication
- Expressive API for nested objects (transcript segments with nested fields)
- Runtime validation with helpful error messages

**Alternatives considered:**
- **Joi** — Mature but not TypeScript-native; types must be written separately
- **express-validator** — Middleware-based, verbose for complex nested schemas
- **class-validator** — Requires decorators and class instances, more boilerplate

**Trade-offs:**
- ✅ TypeScript types inferred from schema, clean API
- ❌ Slightly larger bundle size than Joi
- ❌ Error formatting requires manual transformation for unified response format

---

## 8. Project Structure: Feature-layered

**Decision:** Organize by technical layer (`controllers/`, `services/`, `models/`, `routes/`) rather than by feature.

```
src/
├── controllers/   # HTTP layer
├── services/      # Business logic
├── models/        # Data layer
├── routes/        # Route definitions
├── middleware/    # Cross-cutting concerns
```

**Why chosen:**
- Clear separation of concerns — HTTP handling, business logic, and data access are distinct
- Easy to find files by role (all controllers in one place)
- Standard Node.js/Express convention familiar to most developers

**Alternatives considered:**
- **Feature-based** (`meetings/controller.ts`, `meetings/service.ts`) — Better for large teams, harder to navigate for solo projects
- **Monolithic** — All logic in route handlers; hard to test and maintain

**Trade-offs:**
- ✅ Clear layers, easy to test services in isolation
- ❌ Adding a feature touches multiple directories
