export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export const unauthorized = (message = "Authentication required") => new HttpError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, message, "FORBIDDEN");
export const notFound = (message = "Not found") => new HttpError(404, message, "NOT_FOUND");
export const conflict = (message = "Conflict") => new HttpError(409, message, "CONFLICT");
export const badRequest = (message = "Invalid request") => new HttpError(400, message, "BAD_REQUEST");
