# Hintro Meeting Intelligence Service

An AI-powered backend service for meeting intelligence — transcripts, automated analysis, action item tracking, and Telegram reminders.

**Live API:** https://hintro-meeting-intellegence-service.vercel.app  
**Interactive Docs:** https://hintro-meeting-intellegence-service.vercel.app/api-docs

---

## Features

- **JWT Authentication** — Secure register/login with Bearer token auth
- **Meeting Management** — Create and manage meetings with structured transcripts
- **AI Analysis** — Groq-powered analysis extracting summaries, action items, decisions, and follow-ups with transcript citations
- **Action Item Tracking** — Full task lifecycle with status transitions (`PENDING → IN_PROGRESS → COMPLETED`) and overdue detection
- **Telegram Reminders** — Hourly cron job sends Telegram notifications for overdue action items
- **Pagination & Filtering** — All list endpoints support page, limit, and sort params
- **Swagger Docs** — Interactive API docs at `/api-docs`
- **Structured Logging** — Request tracing with Pino logger

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | MongoDB (Mongoose) |
| AI | Groq SDK (LLaMA) |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Pino + pino-http |
| Scheduler | node-cron |
| Notifications | Telegram Bot API |
| Docs | Swagger UI + swagger-jsdoc |
| Deploy | Vercel (serverless) + Render |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB URI (MongoDB Atlas recommended)
- Groq API key
- Telegram Bot token (optional, for reminders)

### Installation

```bash
git clone https://github.com/Subhan030/hintro-meeting-intellegence-service.git
cd hintro-meeting-intellegence-service
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/hintro
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
DEPLOYED_URL=https://hintro-meeting-intellegence-service.vercel.app
PORT=3000
```

### Run Locally

```bash
npm run dev
```

Server starts at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api-docs`

### Build for Production

```bash
npm run build
npm start
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and get JWT token |

### Meetings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/meetings` | ✅ | List all meetings (paginated) |
| `POST` | `/api/meetings` | ✅ | Create a new meeting |
| `GET` | `/api/meetings/:id` | ✅ | Get meeting by ID |
| `PATCH` | `/api/meetings/:id` | ✅ | Update a meeting |
| `DELETE` | `/api/meetings/:id` | ✅ | Delete a meeting |
| `POST` | `/api/meetings/:id/analyze` | ✅ | Trigger AI analysis |

### Action Items

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/action-items` | ✅ | List action items (filterable by status) |
| `POST` | `/api/action-items` | ✅ | Create a manual action item |
| `GET` | `/api/action-items/overdue` | ✅ | Get overdue items |
| `GET` | `/api/action-items/:id` | ✅ | Get action item by ID |
| `PATCH` | `/api/action-items/:id/status` | ✅ | Update status |
| `DELETE` | `/api/action-items/:id` | ✅ | Delete action item |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ❌ | API info and endpoint map |
| `GET` | `/health` | ❌ | Health check |
| `GET` | `/api/evaluation` | ❌ | System evaluation metrics |

---

## Usage Example

### 1. Register

```bash
curl -X POST https://hintro-meeting-intellegence-service.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"SecurePass123!"}'
```

### 2. Login

```bash
curl -X POST https://hintro-meeting-intellegence-service.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"SecurePass123!"}'
# → { "data": { "token": "eyJ..." } }
```

### 3. Create a Meeting

```bash
curl -X POST https://hintro-meeting-intellegence-service.vercel.app/api/meetings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["Alice", "Bob"],
    "meetingDate": "2024-06-07T10:00:00Z",
    "transcript": [
      { "timestamp": "00:01", "speaker": "Alice", "text": "We should ship v2 by Friday." },
      { "timestamp": "00:45", "speaker": "Bob", "text": "I will handle the release notes." }
    ]
  }'
```

### 4. Analyze with AI

```bash
curl -X POST https://hintro-meeting-intellegence-service.vercel.app/api/meetings/MEETING_ID/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
# → AI extracts summary, action items, decisions with transcript citations
```

---

## Project Structure

```
src/
├── app.ts               # Express app setup
├── config/
│   ├── db.ts            # MongoDB connection (serverless-safe)
│   ├── logger.ts        # Pino logger
│   └── swagger.ts       # Swagger spec + UI setup
├── controllers/         # Route handler logic
├── middleware/          # Auth, error, trace middleware
├── models/              # Mongoose schemas
├── routes/              # Express routers
├── services/            # Business logic layer
├── jobs/
│   └── reminder.job.ts  # Hourly Telegram reminder cron
├── integrations/        # Telegram, Groq integrations
├── utils/               # ApiError, asyncHandler, response helpers
├── types/               # TypeScript type extensions
└── validators/          # Zod validation schemas
api/
└── index.ts             # Vercel serverless entry point
```

---

## Deployment

### Vercel (Serverless)

The project includes a [`vercel.json`](./vercel.json) that routes all traffic through `api/index.ts`. The DB connection is lazy and cached for warm serverless invocations.

Make sure these environment variables are set in **Vercel → Settings → Environment Variables**:
- `MONGODB_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `DEPLOYED_URL`

### Render

The [`render.yaml`](./render.yaml) and [`Procfile`](./Procfile) configure Render deployment. The `Procfile` tells Render to start the app with `npm start`.

---

## Response Format

All endpoints follow a unified response structure:

```json
{
  "traceId": "abc-123-def-456",
  "success": true,
  "data": { }
}
```

Errors:
```json
{
  "traceId": "abc-123-def-456",
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

---
