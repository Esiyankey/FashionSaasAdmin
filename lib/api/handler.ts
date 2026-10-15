import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { HttpError } from "./errors";

/**
 * Every error response from this API has the shape
 * `{ message: string, code: string, fieldErrors?: Record<string, string[]> }`.
 * (`issues` mirrors `fieldErrors` for older admin clients.)
 */
export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { message: error.message, code: error.code, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) },
      { status: error.status, headers: error.headers }
    );
  }
  if (error instanceof ZodError) {
    const fieldErrors = fieldErrorsFromZod(error);
    return NextResponse.json(
      { message: "Validation failed", code: "VALIDATION_ERROR", fieldErrors, issues: fieldErrors },
      { status: 422 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ message: "Request body must be valid JSON", code: "BAD_REQUEST" }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A record with these details already exists", code: "CONFLICT" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
  }
  console.error(error);
  return NextResponse.json({ message: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
}

/** Flattens nested zod paths into dotted keys, e.g. `shippingAddress.city`. */
function fieldErrorsFromZod(error: ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<NextResponse | Response>;

export function handleRoute<Args extends unknown[]>(fn: RouteHandler<Args>): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export function parsePagination(params: URLSearchParams, defaultPageSize = 20, maxPageSize = 100): Pagination {
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Math.floor(Number(params.get("pageSize"))) || defaultPageSize));
  return { page, pageSize };
}

/** The one list envelope used by every paginated endpoint. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginated<T>(items: T[], total: number, { page, pageSize }: Pagination): Paginated<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
