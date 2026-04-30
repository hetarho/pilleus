import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { PrdTitle } from "../value-objects/prd-title";

interface PrdProps {
  id: string;
  productId: string;
  title: PrdTitle;
  /** Index into the parent product's benefits[] array, or null if not tied
   * to a single benefit. Position-based, so a benefit reorder will rotate
   * the link — accept that for now in exchange for schema simplicity. */
  benefitIndex: number | null;
  /** Markdown content. */
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Prd extends AggregateRoot<string> {
  private constructor(private props: PrdProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    title: string;
    benefitIndex?: number | null;
    content?: string;
  }): Prd {
    const now = new Date();
    return new Prd({
      id: crypto.randomUUID(),
      productId: input.productId,
      title: PrdTitle.create(input.title),
      benefitIndex: input.benefitIndex ?? null,
      content: input.content ?? "",
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    title: string;
    benefitIndex: number | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }): Prd {
    return new Prd({
      id: raw.id,
      productId: raw.productId,
      title: PrdTitle.create(raw.title),
      benefitIndex: raw.benefitIndex,
      content: raw.content,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  get productId(): string {
    return this.props.productId;
  }

  get title(): PrdTitle {
    return this.props.title;
  }

  get benefitIndex(): number | null {
    return this.props.benefitIndex;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(title: string): void {
    this.props = { ...this.props, title: PrdTitle.create(title), updatedAt: new Date() };
  }

  setBenefitIndex(idx: number | null): void {
    this.props = { ...this.props, benefitIndex: idx, updatedAt: new Date() };
  }

  setContent(content: string): void {
    this.props = { ...this.props, content, updatedAt: new Date() };
  }

  belongsTo(productId: string): boolean {
    return this.props.productId === productId;
  }
}
