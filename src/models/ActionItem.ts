import mongoose, { Schema, Document } from "mongoose";

export interface IReminderHistory {
  sentAt: Date;
  channel: string;
}

export interface IActionItem extends Document {
  meetingId: mongoose.Types.ObjectId;
  task: string;
  assignee: string;
  dueDate: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  citations: { timestamp: string }[];
  reminderHistory: IReminderHistory[];
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reminderHistorySchema = new Schema(
  {
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    channel: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const actionItemSchema = new Schema<IActionItem>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },

    task: {
      type: String,
      required: true,
    },

    assignee: {
      type: String,
      required: true,
      index: true,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
      default: "PENDING",
      index: true,
    },

    citations: [
      {
        timestamp: {
          type: String,
          required: true,
        },
      },
    ],

    reminderHistory: {
      type: [reminderHistorySchema],
      default: [],
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


actionItemSchema.index({ status: 1, dueDate: 1 });
actionItemSchema.index({ ownerId: 1, status: 1 });

export default mongoose.model<IActionItem>("ActionItem", actionItemSchema);