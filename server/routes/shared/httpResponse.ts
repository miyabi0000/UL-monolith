import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export function sendSuccess<T>(
  res: Response,
  payload: SuccessResponse<T>,
  statusCode = 200
): Response {
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  error?: unknown,
  statusCode = 500
): Response {
  const payload: ErrorResponse = { success: false, message };
  if (error !== undefined) {
    payload.error = error instanceof Error ? error.message : 'Unknown error';
  }
  return res.status(statusCode).json(payload);
}
