import ActionItem, { IActionItem } from "../models/ActionItem";
import { ApiError } from "../utils/ApiError";
import mongoose from "mongoose";

export class ActionItemService {
  async createActionItem(data: {
    meetingId: string;
    task: string;
    assignee: string;
    dueDate: Date;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    citations: { timestamp: string }[];
    ownerId: string;
  }) {
    return ActionItem.create(data);
  }

  async getActionItems(
    ownerId: string,
    filters?: {
      status?: string;
      assignee?: string;
      meetingId?: string;
    }
  ) {
    const query: any = { ownerId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.assignee) {
      query.assignee = filters.assignee;
    }

    if (filters?.meetingId) {
      query.meetingId = filters.meetingId;
    }

    return ActionItem.find(query)
      .populate("meetingId", "title meetingDate")
      .sort({ dueDate: 1 });
  }

  async getActionItemById(actionItemId: string, ownerId: string) {
    return ActionItem.findOne({
      _id: actionItemId,
      ownerId,
    }).populate("meetingId", "title meetingDate");
  }

  async updateActionItemStatus(
    actionItemId: string,
    ownerId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) {
    const actionItem = await ActionItem.findOneAndUpdate(
      {
        _id: actionItemId,
        ownerId,
      },
      { status },
      { new: true }
    ).populate("meetingId", "title meetingDate");

    if (!actionItem) {
      throw new ApiError(404, "ACTION_ITEM_NOT_FOUND", "Action item not found");
    }

    return actionItem;
  }

  async getOverdueItems(ownerId?: string) {
    const now = new Date();
    const query: any = {
      status: { $ne: "COMPLETED" },
      dueDate: { $lt: now },
    };

    if (ownerId) {
      query.ownerId = ownerId;
    }

    return ActionItem.find(query)
      .populate("meetingId", "title meetingDate")
      .populate("ownerId", "name email")
      .sort({ dueDate: 1 });
  }

  async recordReminder(actionItemId: string, channel: string) {
    return ActionItem.findByIdAndUpdate(
      actionItemId,
      {
        $push: {
          reminderHistory: {
            sentAt: new Date(),
            channel,
          },
        },
      },
      { new: true }
    );
  }

  async deleteActionItem(actionItemId: string, ownerId: string) {
    return ActionItem.findOneAndDelete({
      _id: actionItemId,
      ownerId,
    });
  }
}

export const actionItemService = new ActionItemService();
