# AI Meeting Analysis - Example Usage

This document provides practical examples of using the AI Meeting Analysis endpoint.

## Prerequisites

1. Set up your Groq API key in `.env`:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

2. Start the server:
```bash
npm run dev
```

3. Register and login to get a JWT token:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Save the JWT token from the login response.

## Example 1: Product Launch Meeting

### Step 1: Create a Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Launch Planning",
    "transcript": "[00:10] Sarah: Good morning everyone. Let me start by saying we need to finalize the launch date for our new mobile app. I propose we launch next Friday, May 15th. [00:45] Mike: That sounds reasonable. I can have the marketing materials ready by Wednesday. [01:20] Sarah: Perfect. Mike, please prepare the press release and social media content. [01:50] Jessica: I will coordinate with the QA team to ensure all bugs are fixed by Thursday. [02:30] Sarah: Great. We have also decided to include the dark mode feature in this release based on user feedback. [03:15] Mike: Should we send out email notifications to all beta users? [03:30] Sarah: Yes, definitely. Mike, add that to your action items. [04:00] Jessica: I suggest we schedule a follow-up meeting on Thursday to review the final checklist. [04:20] Sarah: Excellent idea. Let me schedule that right away."
  }'
```

### Step 2: Analyze the Meeting

Copy the meeting `_id` from the response and run:

```bash
curl -X POST http://localhost:3000/api/meetings/MEETING_ID_HERE/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Output

```json
{
  "traceId": "abc-123-def-456",
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "meetingId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "summary": [
      {
        "text": "Team is planning to launch the new mobile app on Friday, May 15th",
        "citations": [
          { "timestamp": "00:10" }
        ]
      },
      {
        "text": "Dark mode feature will be included in this release based on user feedback",
        "citations": [
          { "timestamp": "02:30" }
        ]
      },
      {
        "text": "Marketing materials will be ready by Wednesday",
        "citations": [
          { "timestamp": "00:45" }
        ]
      }
    ],
    "actionItems": [
      {
        "task": "Prepare the press release and social media content",
        "assignee": "Mike",
        "citations": [
          { "timestamp": "01:20" }
        ]
      },
      {
        "task": "Coordinate with the QA team to ensure all bugs are fixed by Thursday",
        "assignee": "Jessica",
        "citations": [
          { "timestamp": "01:50" }
        ]
      },
      {
        "task": "Send out email notifications to all beta users",
        "assignee": "Mike",
        "citations": [
          { "timestamp": "03:30" }
        ]
      }
    ],
    "decisions": [
      {
        "text": "Launch date set for Friday, May 15th",
        "citations": [
          { "timestamp": "00:10" }
        ]
      },
      {
        "text": "Include dark mode feature in the release",
        "citations": [
          { "timestamp": "02:30" }
        ]
      }
    ],
    "followUps": [
      {
        "text": "Schedule a follow-up meeting on Thursday to review the final checklist",
        "citations": [
          { "timestamp": "04:00" }
        ]
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Example 2: Sprint Planning Meeting

### Create Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sprint 24 Planning",
    "transcript": "[00:05] Alex: Welcome to Sprint 24 planning. Our goal is to complete the authentication system this sprint. [00:30] Emma: I can take the login API implementation. Should be done in 3 days. [01:00] Alex: Perfect. Emma will work on the login API. [01:15] David: I will handle the JWT token generation and validation logic. [01:45] Alex: Great. We have decided to use bcrypt for password hashing instead of plain MD5. [02:20] Emma: What about the password reset flow? [02:35] Alex: Good point. David, can you also include password reset in your tasks? [02:50] David: Sure, I will add that. [03:10] Alex: We should also set up a code review session mid-sprint to catch any issues early. [03:30] Emma: Agreed. Let me schedule that for Wednesday afternoon."
  }'
```

### Analyze

```bash
curl -X POST http://localhost:3000/api/meetings/MEETING_ID_HERE/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Example 3: Budget Approval Meeting

### Create Meeting with Decisions Focus

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q2 2024 Budget Review",
    "transcript": "[00:10] CFO: We need to discuss the Q2 budget allocations. [00:40] CFO: After reviewing the proposals, we have approved $150,000 for the marketing department. [01:20] Marketing Head: Thank you. I will prepare a detailed spending plan. [01:50] CFO: The engineering department will receive $200,000 for infrastructure upgrades. [02:30] CTO: Excellent. We will focus on migrating to cloud services. [03:00] CFO: We have decided to postpone the office renovation project to Q3 due to budget constraints. [03:45] HR: Understood. Should we revisit this in the next quarterly meeting? [04:00] CFO: Yes, let me schedule that discussion for early July."
  }'
```

## Example 4: Customer Feedback Review

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Customer Feedback Analysis",
    "transcript": "[00:05] Product Manager: We received over 200 responses from our recent survey. [00:35] Product Manager: The top request is for a mobile app, mentioned by 65% of respondents. [01:10] UX Designer: I will create mockups for the mobile app design by next week. [01:40] Product Manager: We also found that 40% of users want offline mode functionality. [02:15] Tech Lead: Offline mode is technically feasible. Let me research the implementation approach. [02:50] Product Manager: Based on this feedback, we have decided to prioritize mobile app development in the next quarter. [03:25] Marketing: Should we send a follow-up survey to gauge interest in specific features? [03:45] Product Manager: Yes, that is a great idea. Please draft that survey by Friday."
  }'
```

## Testing the Grounding Feature

To test that the system doesn't hallucinate, try analyzing a meeting with minimal information:

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Brief Check-in",
    "transcript": "[00:05] Manager: Quick check-in. How is everyone doing? [00:20] Team: Good! [00:25] Manager: Great. Let me know if you need anything. [00:30] Team: Will do."
  }'
```

When analyzed, this should produce minimal results with proper citations, demonstrating that the system doesn't invent content that isn't in the transcript.

## Postman Collection

Import this collection into Postman for easier testing:

```json
{
  "info": {
    "name": "Meeting Intelligence API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/auth/register",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Meetings",
      "item": [
        {
          "name": "Create Meeting",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Product Launch Planning\",\n  \"transcript\": \"[00:10] Sarah: We should launch next Friday. [00:20] Mike: I will prepare the release notes.\"\n}"
            },
            "url": {
              "raw": "http://localhost:3000/api/meetings",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "meetings"]
            }
          }
        },
        {
          "name": "Analyze Meeting",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:3000/api/meetings/{{meeting_id}}/analyze",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "meetings", "{{meeting_id}}", "analyze"]
            }
          }
        }
      ]
    }
  ]
}
```

## Tips for Best Results

1. **Use Detailed Transcripts**: Include speaker names and context
2. **Add Timestamps**: Format like `[00:10]`, `[01:25]`, etc.
3. **Be Explicit**: Clearly state action items, assignees, and decisions
4. **Include Context**: Mention background information when relevant
5. **Speaker Attribution**: Always mention who said what

## Verifying Citations

To verify that citations are working correctly, check that:

1. Every item in the response has at least one citation
2. Timestamps in citations match actual timestamps in the transcript
3. The cited content actually supports the extracted insight
4. No information is invented or assumed

## Common Issues

### Issue: "EMPTY_TRANSCRIPT" Error
**Solution**: Ensure the meeting has a transcript before analyzing

### Issue: Analysis returns empty arrays
**Cause**: Transcript may be too vague or informal
**Solution**: Provide more structured content with clear action items and decisions

### Issue: Slow response times
**Cause**: Very long transcripts
**Solution**: Consider splitting long meetings into segments

### Issue: Missing action items
**Cause**: Tasks weren't explicitly assigned in the transcript
**Solution**: Be explicit about who is responsible for what in the meeting transcript
