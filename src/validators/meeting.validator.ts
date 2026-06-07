import { z } from "zod";

const transcriptSegmentSchema = z.object({
  timestamp: z.string().min(1),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const createMeetingSchema = z.object({
  title: z.string().min(1),
  participants: z.array(z.string()).optional().default([]),
  meetingDate: z.string().datetime().or(z.date()).optional(),
  transcript: z.array(transcriptSegmentSchema).min(1),
});

export const updateMeetingSchema = z.object({
  title: z.string().optional(),
  participants: z.array(z.string()).optional(),
  meetingDate: z.string().datetime().or(z.date()).optional(),
  transcript: z.array(transcriptSegmentSchema).optional(),
});

