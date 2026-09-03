import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { HttpError } from "./errors";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Validation failed", code: "VALIDATION_ERROR", issues: error.flatten().fieldErrors },
      { status: 422 }
    );
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

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<NextResponse>;

export function handleRoute<Args extends unknown[]>(fn: RouteHandler<Args>): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return apiErrorResponse(error);
    }
  };
}
