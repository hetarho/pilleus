import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ProductName } from "../value-objects/product-name";

interface ProductProps {
  id: string;
  name: ProductName;
  description: string | null;
  mission: string | null;
  benefits: readonly string[];
  principles: readonly string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const sanitizeList = (xs: readonly string[]): string[] =>
  xs.map((x) => x.trim()).filter((x) => x.length > 0);

const sanitizeOptional = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const trimmed = s.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class Product extends AggregateRoot<string> {
  private constructor(private props: ProductProps) {
    super(props.id);
  }

  static create(input: {
    name: string;
    description?: string | null;
    userId: string;
  }): Product {
    const now = new Date();
    return new Product({
      id: crypto.randomUUID(),
      name: ProductName.create(input.name),
      description: sanitizeOptional(input.description),
      mission: null,
      benefits: [],
      principles: [],
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    name: string;
    description: string | null;
    mission: string | null;
    benefits: string[];
    principles: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return new Product({
      id: raw.id,
      name: ProductName.create(raw.name),
      description: raw.description,
      mission: raw.mission,
      benefits: raw.benefits,
      principles: raw.principles,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  get name(): ProductName {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get mission(): string | null {
    return this.props.mission;
  }

  get benefits(): readonly string[] {
    return this.props.benefits;
  }

  get principles(): readonly string[] {
    return this.props.principles;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: string): void {
    this.props = { ...this.props, name: ProductName.create(name), updatedAt: new Date() };
  }

  describe(description: string | null): void {
    this.props = { ...this.props, description: sanitizeOptional(description), updatedAt: new Date() };
  }

  /** Replace the full overview (mission + benefits + principles) atomically. */
  updateOverview(input: {
    mission: string | null;
    benefits: readonly string[];
    principles: readonly string[];
  }): void {
    this.props = {
      ...this.props,
      mission: sanitizeOptional(input.mission),
      benefits: sanitizeList(input.benefits),
      principles: sanitizeList(input.principles),
      updatedAt: new Date(),
    };
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }
}
