import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { PrdTitle } from "../value-objects/prd-title";

export type PrdStatus = "draft" | "published" | "ai_reviewed";
export const PRD_STATUSES: readonly PrdStatus[] = ["draft", "published", "ai_reviewed"];

interface PrdProps {
  id: string;
  productId: string;
  title: PrdTitle;
  /** Stable id of the benefit this PRD serves, or null if not tied to a single
   * benefit. References inward into the Intent ring; cleared to null if the
   * benefit is deleted. */
  benefitId: string | null;
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
    benefitId?: string | null;
    content?: string;
  }): Prd {
    const now = new Date();
    return new Prd({
      id: crypto.randomUUID(),
      productId: input.productId,
      title: PrdTitle.create(input.title),
      benefitId: input.benefitId ?? null,
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
    benefitId: string | null;
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
      benefitId: raw.benefitId,
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

  get benefitId(): string | null {
    return this.props.benefitId;
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

  setBenefitId(benefitId: string | null): void {
    this.props = { ...this.props, benefitId, updatedAt: new Date() };
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
}

function normalizeStatus(s: string): PrdStatus {
  return (PRD_STATUSES as readonly string[]).includes(s) ? (s as PrdStatus) : "draft";
}
