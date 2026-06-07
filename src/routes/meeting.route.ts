import { Router } from "express";

import { authMiddleware }
from "../middleware/auth.middleware";

import {
  createMeeting, getMeetings, getMeetingById, updateMeeting, deleteMeeting, analyzeMeeting
} from "../controllers/meeting.controller";

const router = Router();


router.post(
  "/",
  authMiddleware,
  createMeeting
);


router.get(
  "/",
  authMiddleware,
  getMeetings
);


router.get(
  "/:id",
  authMiddleware,
  getMeetingById
);


router.patch(
  "/:id",
  authMiddleware,
  updateMeeting
);


router.delete(
  "/:id",
  authMiddleware,
  deleteMeeting
);


router.post(
  "/:id/analyze",
  authMiddleware,
  analyzeMeeting
);


export default router;