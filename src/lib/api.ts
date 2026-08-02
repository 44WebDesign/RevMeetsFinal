import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, ...(extra ? { details: extra } : {}) }, { status });
}

// Wrap a route handler so thrown Zod/Auth/unknown errors become clean JSON.
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail("Validation failed", 422, err.flatten().fieldErrors);
      }
      if (err instanceof AuthError) {
        return fail(err.message, err.status);
      }
      console.error("[api] unhandled error:", err);
      return fail("Something went wrong", 500);
    }
  };
}
