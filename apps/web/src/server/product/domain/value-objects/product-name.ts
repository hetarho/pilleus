import { ValueObject } from "../../../shared/domain/value-object";
import { ValidationError } from "../../../shared/errors/domain-error";

interface ProductNameProps {
  value: string;
}

const MAX_LENGTH = 100;

export class ProductName extends ValueObject<ProductNameProps> {
  static create(value: string): ProductName {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError("Product name must not be empty");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new ValidationError(`Product name must be at most ${MAX_LENGTH} characters`);
    }
    return new ProductName({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
