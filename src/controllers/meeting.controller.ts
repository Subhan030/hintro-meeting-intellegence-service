import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler";
import { createMeetingSchema,updateMeetingSchema }
from "../validators/meeting.validator";

import { meetingService }
from "../services/meeting.service";

export const createMeeting =
  asyncHandler(async (req: Request, res: Response) => {
    console.log("BODY:", req.body);
console.log("USER:", req.user);
    const data =
      createMeetingSchema.parse(req.body);

    const meeting =
      await meetingService.createMeeting({
        ...data,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
        ownerId: req.user!.userId,
      });

    return res.status(201).json({
      traceId: req.traceId,
      success: true,
      data: meeting,
    });
  });

export const getMeetings = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const { page, limit, analysisStatus, startDate, sort } = req.query;

  const result =
    await meetingService.getMeetings(
      req.user!.userId,
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        analysisStatus: analysisStatus as string,
        startDate: startDate as string,
        sort: sort as string
      }
    );

  return res.json({
    traceId: req.traceId,
    success: true,
    data: result,
  });
});

export const getMeetingById = asyncHandler(async (
  req: Request,
  res: Response
) => {

  const meeting = await meetingService.getMeetingById(
    String(req.params.id),
    req.user!.userId
  );

  if (!meeting) {
    throw new ApiError(
      404,
      "MEETING_NOT_FOUND",
      "Meeting not found"
    );
  }

  return res.json({
    traceId: req.traceId,
    success: true,
    data: meeting,
  });
});

export const updateMeeting = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const data =
    updateMeetingSchema.parse(
      req.body
    );

  const updateData: any = { ...data };
  if (updateData.meetingDate) {
    updateData.meetingDate = new Date(updateData.meetingDate);
  }

  const meeting =
    await meetingService.updateMeeting(
      String(req.params.id),
      req.user!.userId,
      updateData
    );

  if (!meeting) {
    throw new ApiError(
      404,
      "MEETING_NOT_FOUND",
      "Meeting not found"
    );
  }

  return res.json({
    traceId: req.traceId,
    success: true,
    data: meeting,
  });
});

export const deleteMeeting = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const meeting =
    await meetingService.deleteMeeting(
      String(req.params.id),
      req.user!.userId
    );

  if (!meeting) {
    throw new ApiError(
      404,
      "MEETING_NOT_FOUND",
      "Meeting not found"
    );
  }

  return res.json({
    traceId: req.traceId,
    success: true,
    data: {
      message:
        "Meeting deleted successfully",
    },
  });
});

export const analyzeMeeting = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const analysis = await meetingService.analyzeMeeting(
    String(req.params.id),
    req.user!.userId
  );

  return res.json({
    traceId: req.traceId,
    success: true,
    data: analysis,
  });
});