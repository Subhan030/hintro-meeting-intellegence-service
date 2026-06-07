# AI Meeting Analysis API

## Overview
The AI Meeting Analysis endpoint uses Groq AI (powered by Llama 3.3 70B) to analyze meeting transcripts and extract key insights with proper grounding and citations.

## Endpoint

### Analyze Meeting
**POST** `/api/meetings/:id/analyze`

Analyzes a meeting transcript and generates:
- Meeting Summary
- Action Items with assignees
- Decisions made during the meeting
- Follow-up Suggestions

### Authentication
Requires JWT authentication via Bearer token in the Authorization header.

### Request

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### URL Parameters
- `id` (string, required): The MongoDB ObjectId of the meeting to analyze

### Response

#### Success Response (200 OK)
```json
{
  "traceId": "uuid-trace-id",
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "meetingId": "507f1f77bcf86cd799439012",
    "summary": [
      {
        "text": "Team plans to launch the new feature next Friday",
        "citations": [
          {
            "timestamp": "00:10"
          }
        ]
      },
      {
        "text": "Budget approval was discussed and confirmed",
        "citations": [
          {
            "timestamp": "01:25"
          }
        ]
      }
    ],
    "actionItems": [
      {
        "task": "Prepare release notes for the new feature",
        "assignee": "Alice",
        "citations": [
          {
            "timestamp": "00:20"
          }
        ]
      },
      {
        "task": "Schedule testing session with QA team",
        "assignee": "Bob",
        "citations": [
          {
            "timestamp": "02:15"
          }
        ]
      }
    ],
    "decisions": [
      {
        "text": "Decided to postpone the mobile app release until Q2",
        "citations": [
          {
            "timestamp": "03:45"
          }
        ]
      }
    ],
    "followUps": [
      {
        "text": "Schedule a follow-up meeting after testing is complete",
        "citations": [
          {
            "timestamp": "04:30"
          }
        ]
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**404 Not Found** - Meeting doesn't exist or doesn't belong to the user
```json
{
  "traceId": "uuid-trace-id",
  "success": false,
  "error": {
    "code": "MEETING_NOT_FOUND",
    "message": "Meeting not found"
  }
}
```

**400 Bad Request** - Empty or missing transcript
```json
{
  "traceId": "uuid-trace-id",
  "success": false,
  "error": {
    "code": "EMPTY_TRANSCRIPT",
    "message": "Meeting transcript is empty or missing"
  }
}
```

**500 Internal Server Error** - Groq API key not configured
```json
{
  "traceId": "uuid-trace-id",
  "success": false,
  "error": {
    "code": "GROQ_API_KEY_MISSING",
    "message": "Groq API key is not configured"
  }
}
```

**500 Internal Server Error** - Missing citations (validation failed)
```json
{
  "traceId": "uuid-trace-id",
  "success": false,
  "error": {
    "code": "MISSING_CITATIONS",
    "message": "All summary items must include citations from the transcript"
  }
}
```

## Grounding & Citation Requirements

### Critical Rules
The AI analysis system enforces strict grounding rules to prevent hallucinations:

1. **No Invented Information**: The system cannot invent:
   - Attendee names
   - Action items
   - Decisions
   - Meeting outcomes
   - Any information not explicitly present in the transcript

2. **Mandatory Citations**: Every piece of generated content must include at least one citation referencing the transcript segment from which it was derived.

3. **Validation**: The system validates that all extracted insights have proper citations before returning the response.

4. **Timestamp Format**: Citations include timestamps in the format they appear in the transcript (e.g., "00:10", "01:25", "02:30").

### What Gets Citations
- **Summary points**: Each key point in the meeting summary
- **Action Items**: Each task with its assignee
- **Decisions**: Each decision made during the meeting
- **Follow-up Suggestions**: Each recommended next step

### Example Transcript Format
For best results, transcripts should include timestamps:

```
[00:10] John: We should launch next Friday.
[00:20] Alice: I'll prepare the release notes.
[01:25] Sarah: The budget has been approved.
[02:15] Bob: I'll schedule the testing session with the QA team.
```

## Configuration

### Environment Variables
Add the following to your `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Getting a Groq API Key
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## AI Model Details

- **Provider**: Groq
- **Model**: llama-3.3-70b-versatile
- **Temperature**: 0.3 (lower temperature for more factual, grounded responses)
- **Max Tokens**: 4000
- **Response Format**: JSON object

## Features

### Intelligent Analysis
- Extracts key discussion points
- Identifies specific action items with assignees
- Captures important decisions
- Suggests relevant follow-up actions

### Caching
- Analysis results are cached in the database
- Subsequent requests for the same meeting return cached results
- Prevents redundant API calls and reduces costs

### Error Handling
- Validates Groq API key configuration
- Checks for empty transcripts
- Ensures user owns the meeting
- Validates citation presence in all insights
- Provides detailed error messages

## Usage Example

### Using cURL
```bash
# First, create a meeting
curl -X POST http://localhost:3000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Planning Meeting",
    "transcript": "[00:10] John: We should launch next Friday. [00:20] Alice: I will prepare the release notes. [01:25] Sarah: The budget has been approved."
  }'

# Then analyze it (use the meeting ID from the response above)
curl -X POST http://localhost:3000/api/meetings/507f1f77bcf86cd799439012/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript/TypeScript
```typescript
const analyzeMeeting = async (meetingId: string, token: string) => {
  const response = await fetch(
    `http://localhost:3000/api/meetings/${meetingId}/analyze`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();
  
  if (result.success) {
    console.log('Summary:', result.data.summary);
    console.log('Action Items:', result.data.actionItems);
    console.log('Decisions:', result.data.decisions);
    console.log('Follow-ups:', result.data.followUps);
  }
};
```

## Best Practices

1. **Transcript Quality**: Provide detailed transcripts with timestamps for best results
2. **Speaker Attribution**: Include speaker names in the transcript
3. **Clear Action Items**: Ensure tasks and assignees are explicitly mentioned in the transcript
4. **Error Handling**: Always check the response status and handle errors appropriately
5. **Caching**: The analysis is cached, so repeated calls won't consume additional API credits

## Limitations

1. **Context Window**: Limited by the model's context window (approximately 4000 tokens for response)
2. **Language**: Best results with English transcripts
3. **Timestamp Format**: Flexible but should be consistent within a transcript
4. **Explicit Content**: Can only extract information explicitly stated in the transcript

## Security

- All endpoints require authentication
- Users can only analyze their own meetings
- API keys are stored securely in environment variables
- Validation prevents hallucinated content from being returned

## Performance

- Average analysis time: 2-5 seconds (depends on transcript length)
- Cached results return instantly
- Groq provides some of the fastest inference speeds available

## Troubleshooting

### "GROQ_API_KEY_MISSING" Error
- Ensure `GROQ_API_KEY` is set in your `.env` file
- Restart the application after adding the key

### "MISSING_CITATIONS" Error
- This indicates the AI generated content without proper grounding
- Try with a more detailed transcript
- Ensure timestamps are included in the transcript

### Empty or Poor Quality Results
- Provide more detailed transcripts
- Include speaker names and timestamps
- Ensure action items and decisions are explicitly stated
