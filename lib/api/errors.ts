export class HttpError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  headers?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    code?: string,
    options: { fieldErrors?: Record<string, string[]>; headers?: Record<string, string> } = {}
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fieldErrors = options.fieldErrors;
    this.headers = options.headers;
  }
}

export const unauthorized = (message = "Authentication required") => new HttpError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, message, "FORBIDDEN");
export const notFound = (message = "Not found") => new HttpError(404, message, "NOT_FOUND");
export const conflict = (message = "Conflict", code = "CONFLICT") => new HttpError(409, message, code);
export const badRequest = (message = "Invalid request") => new HttpError(400, message, "BAD_REQUEST");
export const validationError = (fieldErrors: Record<string, string[]>, message = "Validation failed") =>
  new HttpError(422, message, "VALIDATION_ERROR", { fieldErrors });
export const tooManyRequests = (retryAfterSeconds: number) =>
  new HttpError(429, "Too many requests, please try again shortly", "RATE_LIMITED", {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
