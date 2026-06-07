import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createActionItem,
  getActionItems,
  getActionItemById,
  updateActionItemStatus,
  getOverdueActionItems,
  deleteActionItem,
} from "../controllers/actionItem.controller";

const router = Router();


router.post("/", authMiddleware, createActionItem);


router.get("/", authMiddleware, getActionItems);


router.get("/overdue", authMiddleware, getOverdueActionItems);


router.get("/:id", authMiddleware, getActionItemById);


router.patch("/:id/status", authMiddleware, updateActionItemStatus);


router.delete("/:id", authMiddleware, deleteActionItem);

export default router;
