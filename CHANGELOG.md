# Changelog

All notable implementation milestones and changes to the Hintro Meeting Intelligence Service.

---

## [1.0.0] — 2026-06-07

### Initial Release

---

### Milestone 1: Project Setup
- Initialized TypeScript + Express project
- Configured `tsconfig.json` with strict mode
- Set up `ts-node-dev` for local development with hot reload
- Added `.env` support via `dotenv`
- Connected to MongoDB Atlas via Mongoose

---

### Milestone 2: Database Models
- **User** — email, hashed password, timestamps
- **Meeting** — title, participants, meetingDate, transcript (array of segments), analysisStatus, AI output fields (summary, decisions, followUps)
- **ActionItem** — task, assignee, dueDate, status enum, meetingId reference, reminderHistory
- **Analysis** — standalone analysis result linked to meeting
- **ReminderHistory** — embedded in ActionItem, tracks sent reminders with channel and sentAt

---

### Milestone 3: Authentication
- `POST /api/auth/register` — bcrypt password hashing, duplicate email check
- `POST /api/auth/login` — password comparison, JWT signing
- `authMiddleware` — Bearer token extraction and verification
- `traceMiddleware` — UUID-based request trace ID injected into all requests and logs

---

### Milestone 4: Meeting CRUD
- `POST /api/meetings` — create with Zod validation on transcript segments
- `GET /api/meetings` — paginated list scoped to authenticated user
- `GET /api/meetings/:id` — ownership-checked retrieval
- `PATCH /api/meetings/:id` — partial update
- `DELETE /api/meetings/:id` — ownership-checked deletion

---

### Milestone 5: AI Analysis Integration
- Integrated Groq SDK with `llama-3.3-70b-versatile` model
- Designed system prompt with explicit hallucination-prevention rules
- Enforced `response_format: { type: "json_object" }` for structured output
- `POST /api/meetings/:id/analyze` triggers analysis and persists results to meeting document
- Server-side `validateAnalysis()` rejects any uncited AI output

---

### Milestone 6: Action Item Management
- `POST /api/action-items` — manual creation linked to a meeting
- `GET /api/action-items` — filtered by status, paginated
- `GET /api/action-items/overdue` — items past due date with non-COMPLETED status
- `GET /api/action-items/:id` — by ID
- `PATCH /api/action-items/:id/status` — status transitions with validation
- `DELETE /api/action-items/:id` — deletion

---

### Milestone 7: Telegram Reminders + Cron Job
- Integrated `node-telegram-bot-api` for Telegram notifications
- `ReminderJob` — hourly `node-cron` schedule (`0 * * * *`)
- Finds overdue action items, checks 24h cooldown, sends Telegram message
- Records reminder in `reminderHistory` on successful send

---

### Milestone 8: Developer Experience
- Added `pino` + `pino-http` structured logging
- Trace ID injected into all log entries via `pino-http` `customProps`
- `ApiError` class for typed, structured error throwing
- `asyncHandler` wrapper for clean async route handlers
- Unified `response` utility (`sendSuccess`, `sendError`) for consistent API shape
- Global `errorMiddleware` catches all unhandled errors

---

### Milestone 9: API Documentation
- Configured `swagger-jsdoc` + `swagger-ui-express`
- Full OpenAPI 3.0 spec with all endpoints, schemas, request/response examples
- Swagger UI served at `/api-docs`
- `/api-docs.json` endpoint for raw spec

---

### Milestone 10: Deployment
- **Vercel** — Added `vercel.json`, `api/index.ts` entry point, serverless-safe lazy DB connection
- **Render** — Added `render.yaml` and `Procfile`
- Fixed `process.exit(1)` anti-pattern for serverless environments
- Added MongoDB connection caching for Vercel warm starts
- Switched Swagger UI to CDN assets (fixes blank `/api-docs` on Vercel)

---

## [1.0.1] — 2026-06-08

### Bug Fixes & Improvements

- **Fix:** Added `GET /` root route returning API info (was `Cannot GET /`)
- **Fix:** Removed `process.exit(1)` from `connectDB` — serverless-safe error handling
- **Fix:** Moved `connectDB()` from module-level to lazy per-request middleware
- **Fix:** Swagger UI blank on Vercel — switched to unpkg CDN for CSS/JS assets
- **Fix:** Swagger dropdowns empty — replaced `swagger-jsdoc` file scanning with inline path definitions
- **Added:** `README.md` with setup guide, API reference, and deployment docs
- **Added:** `DECISIONS.md`, `AI_APPROACH.md`, `TESTING.md`, `CHANGELOG.md`, `CHECKLIST.md`
