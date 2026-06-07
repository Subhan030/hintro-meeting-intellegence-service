import mongoose, { Schema, Document } from "mongoose";

export interface ITranscriptSegment {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface ISummaryItem {
  text: string;
  citations: { timestamp: string }[];
}

export interface IGeneratedActionItem {
  task: string;
  assignee: string;
  citations: { timestamp: string }[];
}

export interface IDecisionItem {
  text: string;
  citations: { timestamp: string }[];
}

export interface IFollowUpItem {
  text: string;
  citations: { timestamp: string }[];
}

export interface IMeeting extends Document {
  title: string;
  participants: string[];
  meetingDate: Date;
  transcript: ITranscriptSegment[];
  summary?: ISummaryItem[];
  actionItems?: IGeneratedActionItem[];
  decisions?: IDecisionItem[];
  followUps?: IFollowUpItem[];
  ownerId: mongoose.Types.ObjectId;
  analysisStatus: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}

const transcriptSegmentSchema = new Schema(
  {
    timestamp: {
      type: String,
      required: true,
    },
    speaker: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const citationSchema = new Schema(
  {
    timestamp: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const summaryItemSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
  },
  { _id: false }
);

const generatedActionItemSchema = new Schema(
  {
    task: {
      type: String,
      required: true,
    },
    assignee: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
  },
  { _id: false }
);

const decisionItemSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
  },
  { _id: false }
);

const followUpItemSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
  },
  { _id: false }
);

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    participants: {
      type: [String],
      default: [],
    },

    meetingDate: {
      type: Date,
      default: Date.now,
    },

    transcript: {
      type: [transcriptSegmentSchema],
      required: true,
      validate: {
        validator: function (v: ITranscriptSegment[]) {
          return v && v.length > 0;
        },
        message: "Transcript must have at least one segment",
      },
    },

    summary: {
      type: [summaryItemSchema],
      default: [],
    },

    actionItems: {
      type: [generatedActionItemSchema],
      default: [],
    },

    decisions: {
      type: [decisionItemSchema],
      default: [],
    },

    followUps: {
      type: [followUpItemSchema],
      default: [],
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    analysisStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

meetingSchema.index({ analysisStatus: 1 });
meetingSchema.index({ meetingDate: -1 });

export default mongoose.model<IMeeting>("Meeting", meetingSchema);