import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const traceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const traceId =
    req.headers["x-trace-id"]?.toString() ||
    randomUUID();

  req.traceId = traceId;

  res.setHeader("x-trace-id", traceId);

  next();
};