import mongoose, { Schema } from "mongoose";

const citationSchema = new Schema(
  {
    timestamp: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const insightSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },

    citations: [citationSchema],
  },
  { _id: false }
);

const actionItemSchema = new Schema(
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

const analysisSchema = new Schema(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      unique: true,
      index: true,
    },

    summary: [insightSchema],

    actionItems: [actionItemSchema],

    decisions: [insightSchema],

    followUps: [insightSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Analysis",
  analysisSchema
);