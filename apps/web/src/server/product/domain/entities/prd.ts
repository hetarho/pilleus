import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { PrdTitle } from "../value-objects/prd-title";

export type PrdStatus = "draft" | "published" | "ai_reviewed";
export const PRD_STATUSES: readonly PrdStatus[] = ["draft", "published", "ai_reviewed"];

interface PrdProps {
  id: string;
  productId: string;
  title: PrdTitle;
  /** Index into the parent product's benefits[] array, or null if not tied
   * to a single benefit. Position-based, so a benefit reorder will rotate
   * the link — accept that for now in exchange for schema simplicity. */
  benefitIndex: number | null;
  /** Markdown content. In draft, this is the form-composed boilerplate;
   * in published, the author-edited markdown; in ai_reviewed, the frozen
   * "before" version. */
  content: string;
  status: PrdStatus;
  /** AI-revised body, populated when status === "ai_reviewed". Null otherwise. */
  aiReviewedContent: string | null;
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
      status: "draft",
      aiReviewedContent: null,
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
    status: string;
    aiReviewedContent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Prd {
    return new Prd({
      id: raw.id,
      productId: raw.productId,
      title: PrdTitle.create(raw.title),
      benefitIndex: raw.benefitIndex,
      content: raw.content,
      status: normalizeStatus(raw.status),
      aiReviewedContent: raw.aiReviewedContent,
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

  get status(): PrdStatus {
    return this.props.status;
  }

  get aiReviewedContent(): string | null {
    return this.props.aiReviewedContent;
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

  setStatus(status: PrdStatus): void {
    this.props = { ...this.props, status, updatedAt: new Date() };
  }

  setAiReviewedContent(content: string | null): void {
    this.props = { ...this.props, aiReviewedContent: content, updatedAt: new Date() };
  }

  belongsTo(productId: string): boolean {
    return this.props.productId === productId;
  }
}

function normalizeStatus(s: string): PrdStatus {
  return (PRD_STATUSES as readonly string[]).includes(s) ? (s as PrdStatus) : "draft";
}
