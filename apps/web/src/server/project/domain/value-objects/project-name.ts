import { ValueObject } from "../../../shared/domain/value-object";
import { ValidationError } from "../../../shared/errors/domain-error";

interface ProjectNameProps {
  value: string;
}

const MAX_LENGTH = 100;

export class ProjectName extends ValueObject<ProjectNameProps> {
  static create(value: string): ProjectName {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError("Project name must not be empty");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new ValidationError(`Project name must be at most ${MAX_LENGTH} characters`);
    }
    return new ProjectName({ value: trimmed });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
