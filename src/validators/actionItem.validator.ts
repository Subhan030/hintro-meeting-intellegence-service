import { z } from "zod";

const citationSchema = z.object({
  timestamp: z.string().min(1),
});

export const createActionItemSchema = z.object({
  meetingId: z.string().min(1),
  task: z.string().min(1),
  assignee: z.string().min(1),
  dueDate: z.string().datetime().or(z.date()),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  citations: z.array(citationSchema).min(1),
});

export const updateActionItemStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

export const actionItemQuerySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  assignee: z.string().optional(),
  meetingId: z.string().optional(),
});
