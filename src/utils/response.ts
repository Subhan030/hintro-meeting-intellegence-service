import { Response } from "express";

export const successResponse = (
  res: Response,
  traceId: string,
  data: unknown,
  status = 200
) => {
  return res.status(status).json({
    traceId,
    success: true,
    data,
  });
};

export const errorResponse = (
  res: Response,
  traceId: string,
  code: string,
  message: string,
  status = 500
) => {
  return res.status(status).json({
    traceId,
    success: false,
    error: {
      code,
      message,
    },
  });
};