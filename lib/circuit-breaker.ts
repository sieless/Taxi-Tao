/**
 * Resilient Circuit Breaker and Timeout Wrapper for External API Calls
 * (e.g. M-Pesa Daraja, Google Maps Geocoding, Resend Email)
 */

interface CircuitBreakerOptions {
  timeoutMs?: number;
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(private options: CircuitBreakerOptions = {}) {
    this.options.timeoutMs = options.timeoutMs ?? 5000;
    this.options.failureThreshold = options.failureThreshold ?? 3;
    this.options.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
  }

  async execute<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const now = Date.now();

    if (this.state === "OPEN") {
      if (now - this.lastFailureTime > this.options.resetTimeoutMs!) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("CIRCUIT_BREAKER_OPEN: Service temporarily unavailable. Please retry shortly.");
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      this.onSuccess();
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.onFailure();
      if (err.name === "AbortError") {
        throw new Error(`TIMEOUT: Operation timed out after ${this.options.timeoutMs}ms`);
      }
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.failureThreshold!) {
      this.state = "OPEN";
    }
  }

  getState() {
    return this.state;
  }
}
