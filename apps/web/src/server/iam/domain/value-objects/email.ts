import { ValueObject } from "../../../shared/domain/value-object";
import { ValidationError } from "../../../shared/errors/domain-error";

interface EmailProps {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<EmailProps> {
  static create(value: string): Email {
    const trimmed = value.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      throw new ValidationError(`Invalid email: ${value}`);
    }
    return new Email({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
