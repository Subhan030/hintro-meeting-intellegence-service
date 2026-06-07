import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  createActionItemSchema,
  updateActionItemStatusSchema,
  actionItemQuerySchema,
} from "../validators/actionItem.validator";
import { actionItemService } from "../services/actionItem.service";

export const createActionItem = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createActionItemSchema.parse(req.body);

    const actionItem = await actionItemService.createActionItem({
      ...data,
      dueDate: new Date(data.dueDate),
      ownerId: req.user!.userId,
    });

    return res.status(201).json({
      traceId: req.traceId,
      success: true,
      data: actionItem,
    });
  }
);

export const getActionItems = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = actionItemQuerySchema.parse(req.query);

    const actionItems = await actionItemService.getActionItems(
      req.user!.userId,
      filters
    );

    return res.json({
      traceId: req.traceId,
      success: true,
      data: actionItems,
    });
  }
);

export const getActionItemById = asyncHandler(
  async (req: Request, res: Response) => {
    const actionItem = await actionItemService.getActionItemById(
      String(req.params.id),
      req.user!.userId
    );

    if (!actionItem) {
      throw new ApiError(404, "ACTION_ITEM_NOT_FOUND", "Action item not found");
    }

    return res.json({
      traceId: req.traceId,
      success: true,
      data: actionItem,
    });
  }
);

export const updateActionItemStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updateActionItemStatusSchema.parse(req.body);

    const actionItem = await actionItemService.updateActionItemStatus(
      String(req.params.id),
      req.user!.userId,
      status
    );

    return res.json({
      traceId: req.traceId,
      success: true,
      data: actionItem,
    });
  }
);

export const getOverdueActionItems = asyncHandler(
  async (req: Request, res: Response) => {
    const overdueItems = await actionItemService.getOverdueItems(
      req.user!.userId
    );

    return res.json({
      traceId: req.traceId,
      success: true,
      data: overdueItems,
    });
  }
);

export const deleteActionItem = asyncHandler(
  async (req: Request, res: Response) => {
    const actionItem = await actionItemService.deleteActionItem(
      String(req.params.id),
      req.user!.userId
    );

    if (!actionItem) {
      throw new ApiError(404, "ACTION_ITEM_NOT_FOUND", "Action item not found");
    }

    return res.json({
      traceId: req.traceId,
      success: true,
      data: {
        message: "Action item deleted successfully",
      },
    });
  }
);
