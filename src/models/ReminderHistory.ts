import mongoose, { Schema } from "mongoose";

const reminderHistorySchema = new Schema(
  {
    actionItemId: {
      type: Schema.Types.ObjectId,
      ref: "ActionItem",
      required: true,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },

    deliveryStatus: {
      type: String,
      default: "SENT",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ReminderHistory",
  reminderHistorySchema
);