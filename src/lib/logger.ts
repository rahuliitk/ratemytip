import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Base Pino logger instance.
 * - Production: JSON output (structured, machine-readable)
 * - Development: pino-pretty for human-readable output
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: { service: "ratemytip" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }),
});

/**
 * Create a child logger scoped to a specific component.
 * Usage: `const log = createLogger("scraper/twitter");`
 */
export function createLogger(component: string): pino.Logger {
  return logger.child({ component });
}
