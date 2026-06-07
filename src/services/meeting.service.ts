import Meeting from "../models/Meeting";
import Analysis from "../models/Analysis";
import { groqService } from "./groq.service";
import { ApiError } from "../utils/ApiError";

export class MeetingService {
  async createMeeting(data: {
    title: string;
    participants?: string[];
    meetingDate?: Date;
    transcript: Array<{timestamp: string, speaker: string, text: string}>;
    ownerId: string;
  }) {
    return Meeting.create({
      ...data,
      analysisStatus: "PENDING",
    });
  }

  async getMeetings(
    ownerId: string,
    options: {
      page?: number;
      limit?: number;
      analysisStatus?: string;
      startDate?: string;
      sort?: string;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { ownerId };

    if (options.analysisStatus) {
      filter.analysisStatus = options.analysisStatus;
    }

    if (options.startDate) {
      filter.meetingDate = { $gte: new Date(options.startDate) };
    }

    const sortOption: any = {};
    if (options.sort) {
      const field = options.sort.startsWith('-') ? options.sort.slice(1) : options.sort;
      const order = options.sort.startsWith('-') ? -1 : 1;
      sortOption[field] = order;
    } else {
      sortOption.createdAt = -1;
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Meeting.countDocuments(filter)
    ]);

    return {
      meetings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

    async getMeetingById(
  meetingId: string,
  ownerId: string
) {
  return Meeting.findOne({
    _id: meetingId,
    ownerId,
  });
}
    async updateMeeting(
  meetingId: string,
  ownerId: string,
  data: {
    title?: string;
    participants?: string[];
    meetingDate?: Date;
    transcript?: Array<{timestamp: string, speaker: string, text: string}>;
  }
) {
  return Meeting.findOneAndUpdate(
    {
      _id: meetingId,
      ownerId,
    },
    data,
    {
      new: true,
    }
  );
}
  async deleteMeeting(
  meetingId: string,
  ownerId: string
) {
  return Meeting.findOneAndDelete({
    _id: meetingId,
    ownerId,
  });
}

  async analyzeMeeting(meetingId: string, ownerId: string) {

    const meeting = await this.getMeetingById(meetingId, ownerId);

    if (!meeting) {
      throw new ApiError(
        404,
        "MEETING_NOT_FOUND",
        "Meeting not found"
      );
    }

    if (!meeting.transcript || meeting.transcript.length === 0) {
      throw new ApiError(
        400,
        "EMPTY_TRANSCRIPT",
        "Meeting transcript is empty or missing"
      );
    }


    if (meeting.analysisStatus === "COMPLETED" &&
        meeting.summary && meeting.summary.length > 0) {
      return {
        summary: meeting.summary,
        actionItems: meeting.actionItems || [],
        decisions: meeting.decisions || [],
        followUps: meeting.followUps || [],
      };
    }

    try {

      const analysisResult = await groqService.analyzeMeeting(meeting.transcript);


      await Meeting.findByIdAndUpdate(meetingId, {
        summary: analysisResult.summary,
        actionItems: analysisResult.actionItems,
        decisions: analysisResult.decisions,
        followUps: analysisResult.followUps,
        analysisStatus: "COMPLETED",
      });

      return analysisResult;
    } catch (error: any) {

      await Meeting.findByIdAndUpdate(meetingId, {
        analysisStatus: "FAILED",
      });
      throw error;
    }
  }
}

export const meetingService =
  new MeetingService();