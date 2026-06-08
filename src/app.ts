import dotenv from "dotenv";


dotenv.config();

import express from "express";
import pinoHttp from "pino-http";

import { connectDB } from "./config/db";
import { logger } from "./config/logger";
import { setupSwagger } from "./config/swagger";
import { authMiddleware } from "./middleware/auth.middleware";
import { traceMiddleware } from "./middleware/trace.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import meetingRoutes from "./routes/meeting.route";
import actionItemRoutes from "./routes/actionItem.routes";
import evaluationRoutes from "./routes/evaluation.routes";
import { reminderJob } from "./jobs/reminder.job";

const app = express();
app.use(express.json());

app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      traceId: req.traceId,
    }),
  })
);

app.use(traceMiddleware);

// Lazy DB connection middleware — safe for serverless cold starts
const dbMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
};

setupSwagger(app);

app.use("/api/auth", dbMiddleware, authRoutes);
app.use("/api/meetings", dbMiddleware, meetingRoutes);
app.use("/api/action-items", dbMiddleware, actionItemRoutes);
app.use("/api/evaluation", dbMiddleware, evaluationRoutes);


app.get("/", (req, res) => {
  res.json({
    name: "Hintro Meeting Intelligence API",
    version: "1.0.0",
    status: "running",
    docs: "/api-docs",
    endpoints: {
      auth: "/api/auth",
      meetings: "/api/meetings",
      actionItems: "/api/action-items",
      evaluation: "/api/evaluation",
      health: "/health",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

app.get("/test-error", (req, res) => {
  throw new Error("Test");
});


app.use(errorMiddleware);

// Start reminder job only in long-running environments (not Vercel serverless)
if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
  connectDB()
    .then(() => {
      reminderJob.start();
      logger.info("Reminder scheduler started");
    })
    .catch((err) => logger.error({ err }, "Failed to connect DB on startup"));
}


if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    logger.info({ port: PORT }, "Server started successfully");
  });
}

export default app;