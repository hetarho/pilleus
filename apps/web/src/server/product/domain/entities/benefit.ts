import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ValidationError } from "../../../shared/errors/domain-error";

interface BenefitProps {
  id: string;
  productId: string;
  label: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const LABEL_MAX = 200;

const sanitizeLabel = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new ValidationError("Benefit must not be empty");
  if (trimmed.length > LABEL_MAX) throw new ValidationError("Benefit is too long");
  return trimmed;
};

export class Benefit extends AggregateRoot<string> {
  private constructor(private props: BenefitProps) {
    super(props.id);
  }

  static create(input: { productId: string; label: string; position: number }): Benefit {
    const now = new Date();
    return new Benefit({
      id: crypto.randomUUID(),
      productId: input.productId,
      label: sanitizeLabel(input.label),
      position: input.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    label: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Benefit {
    return new Benefit({ ...raw });
  }

  get productId(): string {
    return this.props.productId;
  }
  get label(): string {
    return this.props.label;
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

  reorder(position: number): void {
    this.props = { ...this.props, position, updatedAt: new Date() };
  }
}
