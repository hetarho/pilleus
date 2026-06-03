import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ValidationError } from "../../../shared/errors/domain-error";

interface PersonaProps {
  id: string;
  productId: string;
  label: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const LABEL_MAX = 200;
const DESCRIPTION_MAX = 1_000;

const sanitizeLabel = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new ValidationError("Persona must not be empty");
  if (trimmed.length > LABEL_MAX) throw new ValidationError("Persona is too long");
  return trimmed;
};

const sanitizeDescription = (s: string | null | undefined): string | null => {
  if (s == null) return null;
  const trimmed = s.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > DESCRIPTION_MAX) {
    throw new ValidationError(`Persona description is too long (max ${DESCRIPTION_MAX} chars)`);
  }
  return trimmed;
};

export class Persona extends AggregateRoot<string> {
  private constructor(private props: PersonaProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    label: string;
    description?: string | null;
    position: number;
  }): Persona {
    const now = new Date();
    return new Persona({
      id: crypto.randomUUID(),
      productId: input.productId,
      label: sanitizeLabel(input.label),
      description: sanitizeDescription(input.description),
      position: input.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    label: string;
    description: string | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Persona {
    return new Persona({ ...raw });
  }

  get productId(): string {
    return this.props.productId;
  }
  get label(): string {
    return this.props.label;
  }
  get description(): string | null {
    return this.props.description;
  }
  get position(): number {
    return this.props.position;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  relabel(label: string): void {
    this.props = { ...this.props, label: sanitizeLabel(label), updatedAt: new Date() };
  }

  describe(description: string | null): void {
    this.props = {
      ...this.props,
      description: sanitizeDescription(description),
      updatedAt: new Date(),
    };
  }

  reorder(position: number): void {
    this.props = { ...this.props, position, updatedAt: new Date() };
  }
}
