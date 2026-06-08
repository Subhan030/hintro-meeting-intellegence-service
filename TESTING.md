# Testing Documentation

This document covers the test scenarios executed, edge cases considered, and limitations discovered during development of the Hintro Meeting Intelligence Service.

---

## Test Scenarios

### Authentication

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 1 | Register with valid email + password | 201, user created | ✅ |
| 2 | Register with duplicate email | 400, error message | ✅ |
| 3 | Register with invalid email format | 400, validation error | ✅ |
| 4 | Register with password too short | 400, validation error | ✅ |
| 5 | Login with correct credentials | 200, JWT token returned | ✅ |
| 6 | Login with wrong password | 401, invalid credentials | ✅ |
| 7 | Login with non-existent email | 401, invalid credentials | ✅ |
| 8 | Access protected route without token | 401, unauthorized | ✅ |
| 9 | Access protected route with expired token | 401, token expired | ✅ |
| 10 | Access protected route with malformed token | 401, unauthorized | ✅ |

---

### Meeting Management

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 11 | Create meeting with valid transcript | 201, meeting created | ✅ |
| 12 | Create meeting without title | 400, validation error | ✅ |
| 13 | Create meeting with empty transcript array | 400, min 1 segment required | ✅ |
| 14 | Create meeting with missing speaker in segment | 400, validation error | ✅ |
| 15 | Get all meetings — paginated | 200, array + pagination meta | ✅ |
| 16 | Get meetings with `page=2&limit=5` | 200, correct page | ✅ |
| 17 | Get meeting by valid ID | 200, meeting object | ✅ |
| 18 | Get meeting by non-existent ID | 404, not found | ✅ |
| 19 | Get another user's meeting | 403/404, access denied | ✅ |
| 20 | Update meeting title | 200, updated meeting | ✅ |
| 21 | Delete meeting by owner | 200, deleted | ✅ |
| 22 | Delete meeting by non-owner | 403/404 | ✅ |

---

### AI Analysis

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 23 | Analyze meeting with clear action items in transcript | 200, action items extracted with citations | ✅ |
| 24 | Analyze meeting with no action items | 200, empty actionItems array | ✅ |
| 25 | Analyze very short transcript (1 segment) | 200, summary returned | ✅ |
| 26 | Analyze meeting with missing GROQ_API_KEY | 500, config error | ✅ |
| 27 | Analyze already-analyzed meeting | 200, re-analysis overwrites | ✅ |
| 28 | Verify all returned insights have citations | Citations array non-empty | ✅ |
| 29 | Verify citations reference valid timestamps | Timestamps match transcript | ✅ |

---

### Action Items

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 30 | Create manual action item | 201, item created | ✅ |
| 31 | Create item without task field | 400, validation error | ✅ |
| 32 | Get all action items | 200, array | ✅ |
| 33 | Filter by status=PENDING | 200, only PENDING items | ✅ |
| 34 | Get overdue items (past due date, not completed) | 200, overdue list | ✅ |
| 35 | Update status PENDING → IN_PROGRESS | 200, status updated | ✅ |
| 36 | Update status IN_PROGRESS → COMPLETED | 200, status updated | ✅ |
| 37 | Update status COMPLETED → PENDING (invalid) | 400, invalid transition | ✅ |
| 38 | Delete action item | 200, deleted | ✅ |

---

### Reminder Job

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 39 | Overdue item reminder — first time | Telegram message sent, reminder logged | ✅ |
| 40 | Overdue item — reminder sent < 24h ago | Reminder skipped (cooldown) | ✅ |
| 41 | No overdue items | Job completes with "No overdue items" log | ✅ |
| 42 | Telegram API fails | Error logged, job continues for other items | ✅ |

---

### System

| # | Scenario | Expected Result | Status |
|---|---|---|---|
| 43 | `GET /` | 200, API info JSON | ✅ |
| 44 | `GET /health` | 200, `{ status: "UP" }` | ✅ |
| 45 | `GET /api/evaluation` | 200, evaluation data | ✅ |
| 46 | Invalid route (`GET /api/xyz`) | 404 or Express default | ✅ |

---

## Edge Cases Considered

### Transcript Edge Cases
- **Empty speaker name** — Rejected by Zod validation (`min(1)`)
- **Empty text segment** — Rejected by Zod validation (`min(1)`)
- **Single segment transcript** — Valid; AI handles gracefully
- **Very long transcript** — May hit model context limits (see limitations)

### AI Analysis Edge Cases
- **Transcript with no decisions** — AI returns empty `decisions: []`
- **Ambiguous assignee** — AI attributes action item to speaker who made the statement
- **Overlapping timestamps** — AI uses the provided timestamp string verbatim
- **Model returns uncited insight** — Server-side validation throws `MISSING_CITATIONS` error

### Authentication Edge Cases
- **JWT with future `iat`** — Rejected by jsonwebtoken
- **JWT signed with wrong secret** — Rejected, 401 returned
- **Request with no Authorization header** — 401 returned immediately

### Pagination Edge Cases
- **`page` beyond total pages** — Returns empty array (not an error)
- **`limit=0`** — Falls back to default or returns 400 depending on validation
- **Negative page number** — Zod/mongoose defaults handle gracefully

---

## Limitations Discovered

### 1. No Integration Tests
- All testing was done manually via Swagger UI, Postman, and curl
- No automated test suite (Jest/Mocha) was implemented in this version
- Unit tests for service-layer functions are pending

### 2. Reminder Job Not Testable on Vercel
- `node-cron` is disabled on Vercel (`VERCEL !== "1"` guard)
- The `runNow()` method exists on `ReminderJob` for manual testing but has no HTTP endpoint exposed

### 3. AI Analysis Timeout Risk
- For transcripts with 50+ segments, Groq response time can approach Vercel's 10-second function timeout
- No streaming or background job fallback implemented

### 4. No Test Database Isolation
- Manual testing was done against the live MongoDB Atlas database
- No separate test database or mock layer was set up

### 5. Telegram Testing Requires Real Bot
- The Telegram integration can only be verified end-to-end with a real bot token and chat ID
- No mock/stub for `notificationService.sendTelegramReminder()` in tests

---

## Tools Used for Testing

- **Swagger UI** — `https://hintro-meeting-intellegence-service.vercel.app/api-docs` (primary)
- **Postman** — For complex multi-step flows (register → login → create meeting → analyze)
- **curl** — Quick endpoint validation
- **Vercel Logs** — Runtime error investigation (`vercel logs`)
- **MongoDB Atlas UI** — Verifying data persistence and document structure
