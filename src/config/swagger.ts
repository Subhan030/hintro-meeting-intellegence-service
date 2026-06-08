import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hintro Meeting Intelligence Service API",
      version: "1.0.0",
      description: `
# Hintro Meeting Intelligence Service

AI-powered meeting intelligence service with action item management and automated reminders.

## Features
- **JWT Authentication** - Secure user authentication with Bearer tokens
- **Meeting Management** - Create, read, update, and delete meetings with structured transcripts
- **AI Analysis** - Groq-powered analysis extracting summaries, action items, decisions, and follow-ups
- **Action Items** - Track tasks with status transitions and overdue detection
- **Automated Reminders** - Hourly cron job for Telegram notifications
- **Pagination & Filtering** - Efficient data retrieval with sorting and filtering
- **Citation Requirement** - All AI insights include transcript citations
- **Hallucination Prevention** - Grounded analysis without invented content

## Getting Started

### 1. Register a User
\`\`\`bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
\`\`\`

### 2. Login
\`\`\`bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
# Returns: { "token": "eyJhbGc..." }
\`\`\`

### 3. Use the Token
Click the **Authorize** button above and enter: \`Bearer YOUR_TOKEN\`

### 4. Create a Meeting
\`\`\`bash
POST /api/meetings
{
  "title": "Planning Meeting",
  "participants": ["Alice", "Bob"],
  "meetingDate": "2024-06-07T10:00:00Z",
  "transcript": [
    {
      "timestamp": "00:10",
      "speaker": "Alice",
      "text": "We should launch next Friday"
    }
  ]
}
\`\`\`

### 5. Analyze Meeting
\`\`\`bash
POST /api/meetings/{meetingId}/analyze
# Returns AI-generated insights with citations
\`\`\`

## Response Format

All endpoints follow a unified response format:

### Success Response
\`\`\`json
{
  "traceId": "abc-123-def-456",
  "success": true,
  "data": { ... }
}
\`\`\`

### Error Response
\`\`\`json
{
  "traceId": "abc-123-def-456",
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
\`\`\`

## Citation Requirement

All AI-generated insights (summaries, action items, decisions, follow-ups) include citations referencing the transcript:

\`\`\`json
{
  "text": "Team plans to launch next Friday",
  "citations": [
    { "timestamp": "00:10" }
  ]
}
\`\`\`

      `
    },
    servers: [
      {
        url: process.env.DEPLOYED_URL || "http://localhost:3000",
        description: "API Server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User registration and login endpoints",
      },
      {
        name: "Meetings",
        description: "Meeting CRUD operations with structured transcripts",
      },
      {
        name: "AI Analysis",
        description: "Groq-powered meeting analysis with citations",
      },
      {
        name: "Action Items",
        description: "Task management with status tracking and overdue detection",
      },
      {
        name: "System",
        description: "Health checks and system evaluation",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token from the login endpoint",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            traceId: {
              type: "string",
              description: "Unique request identifier",
              example: "abc-123-def-456",
            },
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Error code for programmatic handling",
                  example: "UNAUTHORIZED",
                },
                message: {
                  type: "string",
                  description: "Human-readable error message",
                  example: "Invalid credentials",
                },
              },
            },
          },
        },
        TranscriptSegment: {
          type: "object",
          required: ["timestamp", "speaker", "text"],
          properties: {
            timestamp: {
              type: "string",
              description: "Timestamp in MM:SS or HH:MM:SS format",
              example: "00:10",
            },
            speaker: {
              type: "string",
              description: "Name of the speaker",
              example: "Alice",
            },
            text: {
              type: "string",
              description: "What the speaker said",
              example: "We should launch next Friday",
            },
          },
        },
        Citation: {
          type: "object",
          required: ["timestamp"],
          properties: {
            timestamp: {
              type: "string",
              description: "Reference to transcript timestamp",
              example: "00:10",
            },
          },
        },
        Meeting: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Meeting ID",
              example: "507f1f77bcf86cd799439011",
            },
            title: {
              type: "string",
              description: "Meeting title",
              example: "Product Planning Meeting",
            },
            participants: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of participant names",
              example: ["Alice", "Bob", "Charlie"],
            },
            meetingDate: {
              type: "string",
              format: "date-time",
              description: "Meeting date and time",
              example: "2024-06-07T10:00:00Z",
            },
            transcript: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TranscriptSegment",
              },
              description: "Structured meeting transcript",
            },
            analysisStatus: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED"],
              description: "AI analysis status",
              example: "PENDING",
            },
            ownerId: {
              type: "string",
              description: "User ID of meeting owner",
              example: "507f1f77bcf86cd799439011",
            },
            summary: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                  },
                  citations: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Citation",
                    },
                  },
                },
              },
              description: "AI-generated summary (after analysis)",
            },
            actionItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task: {
                    type: "string",
                  },
                  assignee: {
                    type: "string",
                  },
                  citations: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Citation",
                    },
                  },
                },
              },
              description: "AI-extracted action items (after analysis)",
            },
          },
        },
        ActionItem: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Action item ID",
              example: "507f1f77bcf86cd799439011",
            },
            task: {
              type: "string",
              description: "Task description",
              example: "Prepare release notes",
            },
            assignee: {
              type: "string",
              description: "Person assigned",
              example: "Bob",
            },
            status: {
              type: "string",
              enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
              description: "Current status",
              example: "PENDING",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              description: "Task due date",
              example: "2024-06-15T10:00:00Z",
            },
            meetingId: {
              type: "string",
              description: "Related meeting ID",
              example: "507f1f77bcf86cd799439011",
            },
            reminderHistory: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sentAt: {
                    type: "string",
                    format: "date-time",
                  },
                  channel: {
                    type: "string",
                    example: "telegram",
                  },
                },
              },
              description: "History of sent reminders",
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                  },
                },
                example: {
                  email: "alice@example.com",
                  password: "SecurePass123!",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: { message: "User registered successfully" },
                  },
                },
              },
            },
            "400": { description: "Validation error or email already exists" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login and get a JWT token",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
                example: {
                  email: "alice@example.com",
                  password: "SecurePass123!",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful — returns JWT token",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  },
                },
              },
            },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/api/meetings": {
        get: {
          tags: ["Meetings"],
          summary: "Get all meetings (paginated)",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", default: 1 }, example: 1 },
            { in: "query", name: "limit", schema: { type: "integer", default: 10 }, example: 10 },
            { in: "query", name: "sort", schema: { type: "string" }, example: "-createdAt" },
          ],
          responses: {
            "200": {
              description: "List of meetings",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      meetings: [
                        {
                          _id: "507f1f77bcf86cd799439011",
                          title: "Sprint Planning",
                          participants: ["Alice", "Bob"],
                          meetingDate: "2024-06-07T10:00:00Z",
                          analysisStatus: "PENDING",
                        },
                      ],
                      total: 1,
                      page: 1,
                      limit: 10,
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["Meetings"],
          summary: "Create a new meeting",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "transcript"],
                  properties: {
                    title: { type: "string" },
                    participants: { type: "array", items: { type: "string" } },
                    meetingDate: { type: "string", format: "date-time" },
                    transcript: {
                      type: "array",
                      minItems: 1,
                      items: { $ref: "#/components/schemas/TranscriptSegment" },
                    },
                  },
                },
                example: {
                  title: "Sprint Planning Meeting",
                  participants: ["Alice", "Bob", "Charlie"],
                  meetingDate: "2024-06-07T10:00:00Z",
                  transcript: [
                    { timestamp: "00:01", speaker: "Alice", text: "Let's aim to ship the new dashboard by end of next week." },
                    { timestamp: "00:45", speaker: "Bob", text: "I'll handle the frontend. Should be done by Thursday." },
                    { timestamp: "01:10", speaker: "Charlie", text: "I can take care of the API integration. I'll need the design specs first." },
                    { timestamp: "02:00", speaker: "Alice", text: "Agreed. We'll go with a two-week sprint. Meeting adjourned." },
                  ],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Meeting created",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      _id: "507f1f77bcf86cd799439011",
                      title: "Sprint Planning Meeting",
                      participants: ["Alice", "Bob", "Charlie"],
                      meetingDate: "2024-06-07T10:00:00Z",
                      analysisStatus: "PENDING",
                      transcript: [
                        { timestamp: "00:01", speaker: "Alice", text: "Let's aim to ship the new dashboard by end of next week." },
                      ],
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error — title or transcript missing/invalid" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/api/meetings/{id}": {
        get: {
          tags: ["Meetings"],
          summary: "Get a meeting by ID",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
          responses: {
            "200": {
              description: "Meeting details",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      _id: "507f1f77bcf86cd799439011",
                      title: "Sprint Planning Meeting",
                      participants: ["Alice", "Bob", "Charlie"],
                      meetingDate: "2024-06-07T10:00:00Z",
                      analysisStatus: "COMPLETED",
                      summary: [{ text: "Team agreed to ship the dashboard by end of next week", citations: [{ timestamp: "00:01" }] }],
                      actionItems: [
                        { task: "Handle frontend implementation", assignee: "Bob", citations: [{ timestamp: "00:45" }] },
                        { task: "Obtain design specs and complete API integration", assignee: "Charlie", citations: [{ timestamp: "01:10" }] },
                      ],
                      decisions: [{ text: "Two-week sprint format agreed", citations: [{ timestamp: "02:00" }] }],
                      followUps: [{ text: "Alice to send design specs to Charlie", citations: [{ timestamp: "01:10" }] }],
                    },
                  },
                },
              },
            },
            "404": { description: "Meeting not found" },
          },
        },
        patch: {
          tags: ["Meetings"],
          summary: "Update a meeting",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    participants: { type: "array", items: { type: "string" } },
                    meetingDate: { type: "string", format: "date-time" },
                    transcript: { type: "array", items: { $ref: "#/components/schemas/TranscriptSegment" } },
                  },
                },
                example: {
                  title: "Sprint Planning Meeting — Revised",
                  participants: ["Alice", "Bob", "Charlie", "Dave"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Meeting updated",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: { _id: "507f1f77bcf86cd799439011", title: "Sprint Planning Meeting — Revised" },
                  },
                },
              },
            },
            "404": { description: "Meeting not found" },
          },
        },
        delete: {
          tags: ["Meetings"],
          summary: "Delete a meeting",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
          responses: {
            "200": {
              description: "Meeting deleted",
              content: {
                "application/json": {
                  example: { traceId: "abc-123-def-456", success: true, data: { message: "Meeting deleted" } },
                },
              },
            },
            "404": { description: "Meeting not found" },
          },
        },
      },
      "/api/meetings/{id}/analyze": {
        post: {
          tags: ["AI Analysis"],
          summary: "Analyze a meeting with Groq AI",
          description: "No request body required. Triggers AI analysis and saves summary, action items, decisions, and follow-ups with transcript citations back to the meeting document.",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439011" }],
          responses: {
            "200": {
              description: "Analysis complete — meeting updated with AI insights",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      analysisStatus: "COMPLETED",
                      summary: [
                        { text: "Team agreed to ship the dashboard by end of next week", citations: [{ timestamp: "00:01" }] },
                      ],
                      actionItems: [
                        { task: "Handle frontend implementation", assignee: "Bob", citations: [{ timestamp: "00:45" }] },
                        { task: "Obtain design specs and complete API integration", assignee: "Charlie", citations: [{ timestamp: "01:10" }] },
                      ],
                      decisions: [
                        { text: "Two-week sprint format agreed", citations: [{ timestamp: "02:00" }] },
                      ],
                      followUps: [
                        { text: "Alice to send design specs to Charlie before Thursday", citations: [{ timestamp: "01:10" }] },
                      ],
                    },
                  },
                },
              },
            },
            "404": { description: "Meeting not found" },
            "500": { description: "AI analysis failed (check GROQ_API_KEY)" },
          },
        },
      },
      "/api/action-items": {
        get: {
          tags: ["Action Items"],
          summary: "Get all action items",
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: "query", name: "status", schema: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] }, example: "PENDING" },
            { in: "query", name: "page", schema: { type: "integer", default: 1 }, example: 1 },
            { in: "query", name: "limit", schema: { type: "integer", default: 10 }, example: 10 },
          ],
          responses: {
            "200": {
              description: "List of action items",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      actionItems: [
                        {
                          _id: "507f1f77bcf86cd799439022",
                          task: "Handle frontend implementation",
                          assignee: "Bob",
                          status: "PENDING",
                          dueDate: "2024-06-15T10:00:00Z",
                          meetingId: "507f1f77bcf86cd799439011",
                          reminderHistory: [],
                        },
                      ],
                      total: 1,
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["Action Items"],
          summary: "Create a manual action item",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["task", "meetingId"],
                  properties: {
                    task: { type: "string" },
                    assignee: { type: "string" },
                    dueDate: { type: "string", format: "date-time" },
                    meetingId: { type: "string" },
                  },
                },
                example: {
                  task: "Prepare release notes for v2.0",
                  assignee: "Bob",
                  dueDate: "2024-06-15T10:00:00Z",
                  meetingId: "507f1f77bcf86cd799439011",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Action item created",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      _id: "507f1f77bcf86cd799439022",
                      task: "Prepare release notes for v2.0",
                      assignee: "Bob",
                      status: "PENDING",
                      dueDate: "2024-06-15T10:00:00Z",
                      meetingId: "507f1f77bcf86cd799439011",
                      reminderHistory: [],
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error — task or meetingId missing" },
          },
        },
      },
      "/api/action-items/overdue": {
        get: {
          tags: ["Action Items"],
          summary: "Get overdue action items",
          description: "Returns items whose dueDate is in the past and status is not COMPLETED.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": {
              description: "List of overdue action items",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: [
                      {
                        _id: "507f1f77bcf86cd799439022",
                        task: "Prepare release notes for v2.0",
                        assignee: "Bob",
                        status: "PENDING",
                        dueDate: "2024-05-01T10:00:00Z",
                        meetingId: "507f1f77bcf86cd799439011",
                        reminderHistory: [{ sentAt: "2024-05-02T10:00:00Z", channel: "telegram" }],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/action-items/{id}": {
        get: {
          tags: ["Action Items"],
          summary: "Get action item by ID",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439022" }],
          responses: {
            "200": {
              description: "Action item details",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      _id: "507f1f77bcf86cd799439022",
                      task: "Prepare release notes for v2.0",
                      assignee: "Bob",
                      status: "IN_PROGRESS",
                      dueDate: "2024-06-15T10:00:00Z",
                      meetingId: "507f1f77bcf86cd799439011",
                      reminderHistory: [],
                    },
                  },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
        delete: {
          tags: ["Action Items"],
          summary: "Delete an action item",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439022" }],
          responses: {
            "200": {
              description: "Deleted successfully",
              content: {
                "application/json": {
                  example: { traceId: "abc-123-def-456", success: true, data: { message: "Action item deleted" } },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/api/action-items/{id}/status": {
        patch: {
          tags: ["Action Items"],
          summary: "Update action item status",
          description: "Valid transitions: PENDING → IN_PROGRESS → COMPLETED",
          security: [{ BearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" }, example: "507f1f77bcf86cd799439022" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
                  },
                },
                example: { status: "IN_PROGRESS" },
              },
            },
          },
          responses: {
            "200": {
              description: "Status updated",
              content: {
                "application/json": {
                  example: {
                    traceId: "abc-123-def-456",
                    success: true,
                    data: {
                      _id: "507f1f77bcf86cd799439022",
                      task: "Prepare release notes for v2.0",
                      assignee: "Bob",
                      status: "IN_PROGRESS",
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid status transition" },
          },
        },
      },
      "/api/evaluation": {
        get: {
          tags: ["System"],
          summary: "Get system evaluation / metrics",
          security: [],
          responses: {
            "200": { description: "System evaluation data" },
          },
        },
      },
      "/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          security: [],
          responses: {
            "200": {
              description: "Service is up",
              content: {
                "application/json": {
                  example: {
                    status: "UP",
                    timestamp: "2024-06-07T10:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {

  const swaggerUiOptions = {
    // Load assets from CDN — required for Vercel serverless (node_modules not served)
    customCssUrl: "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
    customJs: [
      "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
      "https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js",
    ],
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { margin: 20px 0; padding: 20px; background: #fafafa; }
    `,
    customSiteTitle: "Hintro API Docs",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        theme: "monokai",
      },
    },
  };

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));


  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger documentation available at /api-docs");
};
