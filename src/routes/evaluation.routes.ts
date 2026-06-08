import { Router } from "express";
import { getEvaluation } from "../controllers/evaluation.controller";

const router = Router();


router.get("/", getEvaluation);

export default router;
