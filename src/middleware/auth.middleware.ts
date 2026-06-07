import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

export const authMiddleware =
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({
          traceId: req.traceId,
          success: false,
          error: {
            code:
              "UNAUTHORIZED",
            message:
              "Token required",
          },
        });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          traceId: req.traceId,
          success: false,
          error: {
            code:
              "INVALID_TOKEN_FORMAT",
            message:
              "Token must be in format: Bearer <token>",
          },
        });
    }

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    try {
      const payload =
        jwt.verify(
          token,
          process.env.JWT_SECRET!
        );

      (req as any).user =
        payload;

      next();
    } catch {
      return res
        .status(401)
        .json({
          traceId: req.traceId,
          success: false,
          error: {
            code:
              "INVALID_TOKEN",
            message:
              "Invalid token",
          },
        });
    }
  };