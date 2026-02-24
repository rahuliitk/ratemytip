export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, `${resource.toUpperCase()}_NOT_FOUND`, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Rate limit exceeded", "RATE_LIMIT_EXCEEDED", 429);
    this.name = "RateLimitError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class PaymentRequiredError extends AppError {
  constructor(requiredTier: string) {
    super(
      `This feature requires a ${requiredTier} subscription`,
      "PAYMENT_REQUIRED",
      402,
      { requiredTier }
    );
    this.name = "PaymentRequiredError";
  }
}

export class SubscriptionError extends AppError {
  constructor(message = "Subscription error") {
    super(message, "SUBSCRIPTION_ERROR", 403);
    this.name = "SubscriptionError";
  }
}
