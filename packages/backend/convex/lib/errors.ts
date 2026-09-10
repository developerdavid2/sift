import { ConvexError } from "convex/values";

type ErrorPayload = {
  code: string;
  message?: string;
};

export class AppError extends ConvexError<ErrorPayload> {
  constructor(code: string, message?: string) {
    super({ code, message });
    this.name = "AppError";
  }
}

export function notAuthenticated(): AppError {
  return new AppError("NOT_AUTHENTICATED", "You must be signed in.");
}

export function forbidden(message = "You don't have access to this."): AppError {
  return new AppError("FORBIDDEN", message);
}

export function notFound(resource: string): AppError {
  return new AppError(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found.`);
}

export function conflict(code: string, message: string): AppError {
  return new AppError(code, message);
}