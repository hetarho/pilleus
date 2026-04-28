export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}

export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
}
