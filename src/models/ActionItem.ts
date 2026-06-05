import mongoose, { Schema } from "mongoose";

const actionItemSchema = new Schema(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },

    task: {
      type: String,
      required: true,
    },

    assignee: {
      type: String,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
      ],
      default: "PENDING",
    },

    citations: [
      {
        timestamp: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

actionItemSchema.index({
  status: 1,
});

actionItemSchema.index({
  dueDate: 1,
});

actionItemSchema.index({
  assignee: 1,
});

export default mongoose.model(
  "ActionItem",
  actionItemSchema
);