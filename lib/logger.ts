/**
 * Logging utility that gates console output by NODE_ENV.
 *
 * SECURITY: Never log PII, tokens, or secrets in production.
 * All console output is gated behind NODE_ENV === "development".
 */

export function logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]`, error, meta);
  }
}

export function logWarn(context: string, message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[${context}]`, message, meta);
  }
}

export function logInfo(context: string, message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${context}]`, message, meta);
  }
}
