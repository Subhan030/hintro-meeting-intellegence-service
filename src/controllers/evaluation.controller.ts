import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

export const getEvaluation = asyncHandler(
  async (req: Request, res: Response) => {
    return res.json({
      traceId: req.traceId,
      success: true,
      data: {
        candidateName: "Subhan Rai",
        email: "raisubhan728@gmail.com",
        repositoryUrl: "https://github.com/Subhan030/hintro-meeting-intellegence-service",
        deployedUrl: process.env.DEPLOYED_URL || "http://localhost:3000",
        externalIntegration: "Telegram Bot API",
        features: [
          "Authentication (JWT)",
          "Meeting CRUD",
          "AI Analysis (Groq - Llama 3.3 70B)",
          "Citation Enforcement",
          "Action Item Management",
          "Overdue Detection",
          "Reminder Scheduler (Hourly)",
          "Telegram Notifications",
          "Swagger Documentation",
          "Structured Logging",
          "Request Tracing",
        ],
        techStack: {
          runtime: "Node.js with TypeScript",
          framework: "Express.js",
          database: "MongoDB with Mongoose",
          aiProvider: "Groq (Llama 3.3 70B Versatile)",
          authentication: "JWT",
          validation: "Zod",
          logging: "Pino",
          scheduling: "node-cron",
          notifications: "Telegram Bot API",
        },
        implementedRequirements: [
          "Structured transcript segments",
          "AI-powered meeting analysis",
          "Grounding with citations",
          "Action item management with CRUD",
          "Overdue detection",
          "Automated reminder scheduler",
          "Telegram integration for notifications",
          "Swagger API documentation",
          "Comprehensive error handling",
          "Request tracing for debugging",
        ],
      },
    });
  }
);
