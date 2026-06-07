import { Request, Response } from "express";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";

import { authService }
from "../services/auth.service";

export const register =
  async (
    req: Request,
    res: Response
  ) => {
    console.log(req.body)
    const data =
      registerSchema.parse(req.body);

    const user =
      await authService.register(
        data.email,
        data.password
      );
      console.log("TRACE ID:", req.traceId);
    return res.status(201).json({
      traceId: req.traceId,
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  };

export const login =
  async (
    req: Request,
    res: Response
  ) => {
    const data =
      loginSchema.parse(req.body);

    const token =
      await authService.login(
        data.email,
        data.password
      );

    return res.json({
      traceId: req.traceId,
      success: true,
      data: {
        token,
      },
    });
  };