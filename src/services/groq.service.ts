import Groq from "groq-sdk";
import { ApiError } from "../utils/ApiError";

interface Citation {
  timestamp: string;
}

interface Insight {
  text: string;
  citations: Citation[];
}

interface ActionItem {
  task: string;
  assignee: string;
  citations: Citation[];
}

interface AnalysisResult {
  summary: Insight[];
  actionItems: ActionItem[];
  decisions: Insight[];
  followUps: Insight[];
}

export class GroqService {
  private groq: Groq | null = null;

  private getGroqClient(): Groq {
    if (!this.groq) {
      if (!process.env.GROQ_API_KEY) {
        throw new ApiError(
          500,
          "GROQ_API_KEY_MISSING",
          "Groq API key is not configured"
        );
      }
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }
    return this.groq;
  }

  async analyzeMeeting(transcriptSegments: Array<{timestamp: string, speaker: string, text: string}>): Promise<AnalysisResult> {

    const groq = this.getGroqClient();


    const transcript = transcriptSegments
      .map((seg) => `[${seg.timestamp}] ${seg.speaker}: ${seg.text}`)
      .join("\n");

    const systemPrompt = `You are an expert meeting analyst. Your task is to analyze meeting transcripts and extract key information with precise grounding.

CRITICAL RULES:
1. ONLY extract information explicitly stated in the transcript
2. DO NOT invent or assume any information
3. Every piece of information MUST include a citation with the timestamp from the transcript
4. If you cannot find specific information in the transcript, DO NOT include it
5. DO NOT make up attendee names, action items, or decisions that aren't explicitly mentioned
6. Extract timestamps in the format they appear in the transcript (e.g., "00:10", "01:25", "02:30")

You must analyze the transcript and provide:
1. Summary: Key points discussed in the meeting (2-5 points)
2. Action Items: Specific tasks assigned to people (include task, assignee, and timestamp)
3. Decisions: Important decisions made during the meeting
4. Follow-up Suggestions: Recommended next steps based on the discussion

Return your analysis in the following JSON format:
{
  "summary": [
    {
      "text": "Clear summary point based on transcript",
      "citations": [{"timestamp": "00:10"}]
    }
  ],
  "actionItems": [
    {
      "task": "Specific task from transcript",
      "assignee": "Person's name mentioned in transcript",
      "citations": [{"timestamp": "00:20"}]
    }
  ],
  "decisions": [
    {
      "text": "Decision made in the meeting",
      "citations": [{"timestamp": "00:30"}]
    }
  ],
  "followUps": [
    {
      "text": "Follow-up suggestion based on discussion",
      "citations": [{"timestamp": "00:40"}]
    }
  ]
}

If a section has no valid information from the transcript, return an empty array for that section.`;

    const userPrompt = `Analyze this meeting transcript and extract the key information with citations:

TRANSCRIPT:
${transcript}

Remember: Only extract information explicitly stated in the transcript. Every piece of information must include citations with timestamps. Do not invent or assume anything.`;

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new ApiError(
          500,
          "AI_ANALYSIS_FAILED",
          "Failed to get response from AI service"
        );
      }

      const analysis: AnalysisResult = JSON.parse(content);


      this.validateAnalysis(analysis);

      return analysis;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("Groq API Error:", error);
      throw new ApiError(
        500,
        "AI_ANALYSIS_ERROR",
        error.message || "Failed to analyze meeting with AI"
      );
    }
  }

  private validateAnalysis(analysis: AnalysisResult): void {
    const sections = [
      { name: "summary", items: analysis.summary },
      { name: "actionItems", items: analysis.actionItems },
      { name: "decisions", items: analysis.decisions },
      { name: "followUps", items: analysis.followUps },
    ];

    for (const section of sections) {
      if (!Array.isArray(section.items)) {
        throw new ApiError(
          500,
          "INVALID_ANALYSIS_FORMAT",
          `${section.name} must be an array`
        );
      }

      for (const item of section.items) {
        if (!item.citations || item.citations.length === 0) {
          throw new ApiError(
            500,
            "MISSING_CITATIONS",
            `All ${section.name} items must include citations from the transcript`
          );
        }


        for (const citation of item.citations) {
          if (!citation.timestamp) {
            throw new ApiError(
              500,
              "INVALID_CITATION",
              `All citations must include a timestamp`
            );
          }
        }
      }
    }
  }
}

export const groqService = new GroqService();
