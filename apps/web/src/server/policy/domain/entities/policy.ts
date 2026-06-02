import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ValidationError } from "../../../shared/errors/domain-error";
import {
  isPolicyCategory,
  isValidSectionFor,
  type PolicyCategory,
} from "@/kernel/policy";

interface PolicyProps {
  id: string;
  productId: string;
  category: PolicyCategory;
  section: string | null;
  title: string;
  body: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const TITLE_MAX = 200;
const BODY_MAX = 10_000;

const sanitizeTitle = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new ValidationError("Policy title must not be empty");
  if (trimmed.length > TITLE_MAX) throw new ValidationError("Policy title is too long");
  return trimmed;
};

const sanitizeBody = (s: string): string => {
  if (s.length > BODY_MAX) throw new ValidationError("Policy body is too long");
  return s;
};

export class Policy extends AggregateRoot<string> {
  private constructor(private props: PolicyProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    category: PolicyCategory;
    section: string | null;
    title: string;
    body: string;
    position: number;
  }): Policy {
    if (!isPolicyCategory(input.category)) {
      throw new ValidationError(`Unknown policy category: ${input.category}`);
    }
    if (!isValidSectionFor(input.category, input.section)) {
      throw new ValidationError(
        `Invalid section "${input.section}" for category "${input.category}"`,
      );
    }
    const now = new Date();
    return new Policy({
      id: crypto.randomUUID(),
      productId: input.productId,
      category: input.category,
      section: input.section,
      title: sanitizeTitle(input.title),
      body: sanitizeBody(input.body ?? ""),
      position: input.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    category: string;
    section: string | null;
    title: string;
    body: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Policy {
    if (!isPolicyCategory(raw.category)) {
      throw new Error(`Unknown policy category in DB: ${raw.category}`);
    }
    return new Policy({ ...raw, category: raw.category });
  }

  get productId(): string {
    return this.props.productId;
  }
  get category(): PolicyCategory {
    return this.props.category;
  }
  get section(): string | null {
    return this.props.section;
  }
  get title(): string {
    return this.props.title;
  }
  get body(): string {
    return this.props.body;
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

  rename(title: string): void {
    this.props = { ...this.props, title: sanitizeTitle(title), updatedAt: new Date() };
  }

  setBody(body: string): void {
    this.props = { ...this.props, body: sanitizeBody(body), updatedAt: new Date() };
  }

  setSection(section: string | null): void {
    if (!isValidSectionFor(this.props.category, section)) {
      throw new ValidationError(
        `Invalid section "${section}" for category "${this.props.category}"`,
      );
    }
    this.props = { ...this.props, section, updatedAt: new Date() };
  }

  reorder(position: number): void {
    this.props = { ...this.props, position, updatedAt: new Date() };
  }
}
