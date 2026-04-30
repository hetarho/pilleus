import { ValueObject } from "../../../shared/domain/value-object";
import { ValidationError } from "../../../shared/errors/domain-error";

interface PrdTitleProps {
  value: string;
}

const MAX_LENGTH = 200;

export class PrdTitle extends ValueObject<PrdTitleProps> {
  static create(value: string): PrdTitle {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError("PRD title must not be empty");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new ValidationError(`PRD title must be at most ${MAX_LENGTH} characters`);
    }
    return new PrdTitle({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
