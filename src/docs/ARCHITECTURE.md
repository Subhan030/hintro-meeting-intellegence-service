# AI Meeting Analysis Architecture

## System Architecture Overview

```
┌─────────────┐
│   Client    │
│  (HTTP)     │
└──────┬──────┘
       │
       │ POST /api/meetings/:id/analyze
       │ Authorization: Bearer <token>
       │
       ▼
┌──────────────────────────────────────────────┐
│           Express Application                │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │   Middleware Stack                     │ │
│  │  1. traceMiddleware (Add trace ID)     │ │
│  │  2. authMiddleware (Verify JWT)        │ │
│  │  3. asyncHandler (Error handling)      │ │
│  └────────────────────────────────────────┘ │
│                    │                         │
│                    ▼                         │
│  ┌────────────────────────────────────────┐ │
│  │   meeting.controller.ts                │ │
│  │   analyzeMeeting()                     │ │
│  └────────────────────────────────────────┘ │
│                    │                         │
│                    ▼                         │
│  ┌────────────────────────────────────────┐ │
│  │   meeting.service.ts                   │ │
│  │   analyzeMeeting(meetingId, ownerId)   │ │
│  └────────────────────────────────────────┘ │
│         │                    │               │
│         ▼                    ▼               │
│  ┌──────────┐        ┌──────────────┐       │
│  │ MongoDB  │        │ groq.service │       │
│  │ Meeting  │        │    .ts       │       │
│  │  Model   │        └──────┬───────┘       │
│  └──────────┘               │               │
└─────────────────────────────┼───────────────┘
                              │
                              │ API Call
                              ▼
                    ┌──────────────────┐
                    │   Groq Cloud     │
                    │  Llama 3.3 70B   │
                    └──────────────────┘
```

## Request Flow Sequence

### 1. Client Request
```
POST /api/meetings/507f1f77bcf86cd799439011/analyze
Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json
```

### 2. Middleware Processing
```
traceMiddleware → Adds unique trace ID
       ↓
authMiddleware → Validates JWT token
       ↓
asyncHandler → Wraps controller for error handling
```

### 3. Controller Layer
```typescript
analyzeMeeting(req, res) {
  // Extract meeting ID and user ID
  meetingId = req.params.id
  userId = req.user.userId
  
  // Call service layer
  analysis = await meetingService.analyzeMeeting(meetingId, userId)
  
  // Return response
  return res.json({ success: true, data: analysis })
}
```

### 4. Service Layer Processing
```typescript
analyzeMeeting(meetingId, ownerId) {
  // Step 1: Verify meeting exists and belongs to user
  meeting = await getMeetingById(meetingId, ownerId)
  if (!meeting) throw ApiError(404, "MEETING_NOT_FOUND")
  
  // Step 2: Validate transcript
  if (empty(meeting.transcript)) throw ApiError(400, "EMPTY_TRANSCRIPT")
  
  // Step 3: Check cache
  existingAnalysis = await Analysis.findOne({ meetingId })
  if (existingAnalysis) return existingAnalysis
  
  // Step 4: Call Groq AI
  result = await groqService.analyzeMeeting(meeting.transcript)
  
  // Step 5: Save to database
  analysis = await Analysis.create({
    meetingId,
    summary: result.summary,
    actionItems: result.actionItems,
    decisions: result.decisions,
    followUps: result.followUps
  })
  
  return analysis
}
```

### 5. Groq Service Processing
```typescript
analyzeMeeting(transcript) {
  // Step 1: Validate API key
  if (!GROQ_API_KEY) throw ApiError(500, "GROQ_API_KEY_MISSING")
  
  // Step 2: Prepare prompts
  systemPrompt = "You are an expert meeting analyst..."
  userPrompt = `Analyze this transcript: ${transcript}`
  
  // Step 3: Call Groq API
  response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  })
  
  // Step 4: Parse and validate
  analysis = JSON.parse(response.choices[0].message.content)
  validateAnalysis(analysis) // Ensures citations exist
  
  return analysis
}
```

### 6. Validation Layer
```typescript
validateAnalysis(analysis) {
  sections = [
    analysis.summary,
    analysis.actionItems,
    analysis.decisions,
    analysis.followUps
  ]
  
  for (section in sections) {
    for (item in section) {
      // Check citations exist
      if (empty(item.citations)) {
        throw ApiError(500, "MISSING_CITATIONS")
      }
      
      // Check timestamps exist
      for (citation in item.citations) {
        if (!citation.timestamp) {
          throw ApiError(500, "INVALID_CITATION")
        }
      }
    }
  }
}
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     Request Phase                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Step 1: Authentication                                  │
│  • Verify JWT token                                     │
│  • Extract user ID                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Meeting Validation                              │
│  • Query: Meeting.findOne({ _id, ownerId })            │
│  • Check: Meeting exists and belongs to user           │
│  • Check: Transcript is not empty                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Cache Check                                     │
│  • Query: Analysis.findOne({ meetingId })              │
│  • If exists: Return cached result (Fast path) ──────┐ │
│  • If not: Continue to AI analysis                   │ │
└─────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              │
┌─────────────────────────────────────────────────────────┐
│ Step 4: AI Analysis (Groq)                             │
│  • Send transcript to Groq                              │
│  • Model: llama-3.3-70b-versatile                      │
│  • Temperature: 0.3                                     │
│  • Response: JSON with citations                        │
└─────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              │
┌─────────────────────────────────────────────────────────┐
│ Step 5: Validation                                      │
│  • Verify all insights have citations                   │
│  • Verify all citations have timestamps                 │
│  • Reject if validation fails                           │
└─────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              │
┌─────────────────────────────────────────────────────────┐
│ Step 6: Save to Database                                │
│  • Create: Analysis.create({...})                      │
│  • Unique constraint on meetingId                       │
│  • Store for future cache hits                          │
└─────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              │
┌─────────────────────────────────────────────────────────┐
│ Step 7: Response                                 ◄──────┘
│  • Format: { success, data, traceId }                  │
│  • Return to client                                     │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Meeting Collection
```javascript
{
  _id: ObjectId,
  title: String,
  transcript: String,
  summary: String,
  ownerId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - ownerId (for user queries)
  - createdAt (for sorting)
```

### Analysis Collection
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId (ref: Meeting, unique),
  summary: [
    {
      text: String,
      citations: [{ timestamp: String }]
    }
  ],
  actionItems: [
    {
      task: String,
      assignee: String,
      citations: [{ timestamp: String }]
    }
  ],
  decisions: [
    {
      text: String,
      citations: [{ timestamp: String }]
    }
  ],
  followUps: [
    {
      text: String,
      citations: [{ timestamp: String }]
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - meetingId (unique, for cache lookups)
```

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  - email (unique, for login)
```

## Error Handling Flow

```
┌──────────────────────────────────────┐
│   Any Layer Throws Error             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   asyncHandler Catches Error         │
│   Passes to next(error)              │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   errorMiddleware                    │
│   - Logs error with trace ID         │
│   - Formats error response           │
│   - Returns JSON to client           │
└──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Client Response                    │
│   {                                  │
│     traceId: "...",                  │
│     success: false,                  │
│     error: {                         │
│       code: "ERROR_CODE",            │
│       message: "..."                 │
│     }                                │
│   }                                  │
└──────────────────────────────────────┘
```

## Security Layers

```
Layer 1: Network
  • HTTPS in production
  • CORS configuration

Layer 2: Authentication
  • JWT token validation
  • Token expiry checks
  • User identity verification

Layer 3: Authorization
  • User can only access own meetings
  • ownerId check on all queries

Layer 4: Input Validation
  • Zod schemas validate request body
  • MongoDB ObjectId validation
  • Empty string checks

Layer 5: API Key Security
  • Environment variables (.env)
  • Never exposed to client
  • Server-side only

Layer 6: Data Security
  • Password hashing (bcrypt)
  • No sensitive data in logs
  • Trace IDs for debugging
```

## Groq Integration Details

### API Configuration
```typescript
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
```

### Request Parameters
```typescript
{
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  temperature: 0.3,        // Lower = more factual
  max_tokens: 4000,        // Response limit
  response_format: {       // Force JSON output
    type: "json_object"
  }
}
```

### System Prompt Strategy
```
1. Define role: "You are an expert meeting analyst"
2. Set strict rules: "ONLY extract explicit information"
3. Prohibit invention: "DO NOT invent or assume anything"
4. Require citations: "Every piece must include timestamp"
5. Provide format: JSON structure with examples
```

## Performance Characteristics

### First Analysis (Cache Miss)
```
Total: ~2-5 seconds
  ├─ Meeting query: ~10-50ms
  ├─ Cache check: ~10-50ms
  ├─ Groq API call: ~2-4 seconds ← Dominant
  ├─ Validation: ~1-5ms
  └─ Database save: ~10-50ms
```

### Subsequent Analysis (Cache Hit)
```
Total: ~20-100ms
  ├─ Meeting query: ~10-50ms
  ├─ Cache check: ~10-50ms (returns immediately)
  └─ Response format: ~1-5ms
```

### Optimization Strategies
1. **Caching**: Unique index on meetingId (implemented)
2. **Database Indexes**: Key fields indexed (implemented)
3. **Connection Pooling**: MongoDB connection reuse (implemented)
4. **Future**: Redis for distributed caching
5. **Future**: Background job processing for large transcripts

## Scalability Considerations

### Current Implementation (Single Server)
- Handles: ~10-50 requests/second
- Bottleneck: Groq API rate limits
- Database: MongoDB handles millions of docs

### Scaling Strategies

#### Horizontal Scaling
```
         Load Balancer
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  Server1  Server2  Server3
    │         │         │
    └─────────┼─────────┘
              ▼
         MongoDB Cluster
```

#### Caching Layer
```
  Request → Redis Check → Cache Hit? → Return
                ↓
           Cache Miss
                ↓
           Process → Save to Redis → Return
```

#### Background Processing
```
  Request → Queue Job → Return 202 Accepted
               ↓
          Worker processes job
               ↓
          Webhook notification (optional)
```

## Monitoring & Observability

### Request Tracing
```typescript
// Every request gets a unique trace ID
traceId: "123e4567-e89b-12d3-a456-426614174000"

// Logged at every step
logger.info({ traceId, step: "authentication" })
logger.info({ traceId, step: "groq_call" })
logger.info({ traceId, step: "validation" })
```

### Logging Strategy
```
1. Request received → Log trace ID, user ID, meeting ID
2. Meeting validated → Log meeting title, transcript length
3. Cache check → Log hit/miss
4. Groq call start → Log transcript length
5. Groq call end → Log response time, token usage
6. Validation → Log any issues
7. Database save → Log success
8. Response sent → Log total time
```

### Metrics to Monitor
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Cache hit rate (%)
- Groq API latency
- Error rate (%)
- Database query time

## Testing Strategy

### Unit Tests
```typescript
describe('groqService', () => {
  test('validates analysis has citations')
  test('throws error on missing API key')
  test('throws error on missing citations')
})

describe('meetingService', () => {
  test('returns cached analysis if exists')
  test('throws error on empty transcript')
  test('throws error on invalid meeting ID')
})
```

### Integration Tests
```typescript
describe('POST /api/meetings/:id/analyze', () => {
  test('returns 401 without auth token')
  test('returns 404 for non-existent meeting')
  test('returns 400 for empty transcript')
  test('returns 200 with valid analysis')
  test('returns cached result on second call')
})
```

### Manual Testing Checklist
- [ ] Create meeting with detailed transcript
- [ ] Analyze meeting (verify citations)
- [ ] Analyze again (verify cache hit)
- [ ] Try with minimal transcript (verify no hallucinations)
- [ ] Try with empty transcript (verify error)
- [ ] Try with invalid meeting ID (verify 404)
- [ ] Try without auth token (verify 401)

## Deployment Architecture

### Production Setup
```
┌─────────────────────────────────────────┐
│              Nginx / Load Balancer      │
│              (HTTPS Termination)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          Node.js Application            │
│          (PM2 / Docker)                 │
└────────┬──────────────────┬─────────────┘
         │                  │
         ▼                  ▼
┌─────────────┐    ┌───────────────┐
│  MongoDB    │    │  Groq Cloud   │
│  (Replica   │    │  (External)   │
│   Set)      │    │               │
└─────────────┘    └───────────────┘
```

### Environment Variables
```env
# Production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong_secret_here
GROQ_API_KEY=gsk_...

# Monitoring (optional)
SENTRY_DSN=...
LOG_LEVEL=info
```

## Conclusion

This architecture provides:
- ✅ Robust error handling
- ✅ Performance optimization with caching
- ✅ Scalability through stateless design
- ✅ Security through multiple layers
- ✅ Observability through request tracing
- ✅ Maintainability through clean separation of concerns
