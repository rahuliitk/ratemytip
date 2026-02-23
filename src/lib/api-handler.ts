import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { AppError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("api");

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js route handler with:
 * - Correlation ID injection (x-correlation-id header)
 * - Structured request/response logging
 * - Automatic AppError → HTTP response mapping
 * - Generic 500 catch-all for unexpected errors
 */
export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const correlationId =
      req.headers.get("x-correlation-id") ?? randomUUID();
    const startTime = Date.now();

    try {
      const res = await handler(req, context);
      const durationMs = Date.now() - startTime;

      log.info(
        {
          method: req.method,
          path: req.nextUrl.pathname,
          status: res.status,
          durationMs,
          correlationId,
        },
        "request completed"
      );

      res.headers.set("x-correlation-id", correlationId);
      return res;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (err instanceof AppError) {
        log.warn(
          {
            method: req.method,
            path: req.nextUrl.pathname,
            status: err.statusCode,
            code: err.code,
            durationMs,
            correlationId,
          },
          err.message
        );

        const res = NextResponse.json(
          {
            success: false,
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          },
          { status: err.statusCode }
        );
        res.headers.set("x-correlation-id", correlationId);
        return res;
      }

      log.error(
        {
          method: req.method,
          path: req.nextUrl.pathname,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          durationMs,
          correlationId,
        },
        "unhandled error"
      );

      const res = NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          },
        },
        { status: 500 }
      );
      res.headers.set("x-correlation-id", correlationId);
      return res;
    }
  };
}
