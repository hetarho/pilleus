import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ValidationError } from "../../../shared/errors/domain-error";
import {
  isTokenGroup,
  type TokenGroup,
} from "@/kernel/design-token";
import { SHADE_STEPS } from "@/kernel/palette";

interface DesignTokenProps {
  id: string;
  productId: string;
  group: TokenGroup;
  name: string;
  position: number;
  paletteId: string | null;
  paletteStep: number | null;
  rawValue: string | null;
  /** Usage guidance — short prose explaining *when* to reach for this
   * token. May be hand-written, AI-generated, or null. */
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DESCRIPTION_MAX = 500;

const sanitizeName = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new ValidationError("Token name must not be empty");
  if (trimmed.length > 80) throw new ValidationError("Token name is too long");
  return trimmed;
};

const sanitizeRawValue = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new ValidationError("Token value must not be empty");
  return trimmed;
};

const sanitizeDescription = (s: string | null | undefined): string | null => {
  if (s == null) return null;
  const trimmed = s.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > DESCRIPTION_MAX) {
    throw new ValidationError(`Token description is too long (max ${DESCRIPTION_MAX} chars)`);
  }
  return trimmed;
};

const ALLOWED_STEPS = new Set<number>(SHADE_STEPS as readonly number[]);

/** Throws unless the per-group value invariants hold:
 *   color: paletteId + paletteStep set, rawValue null
 *   other: rawValue set, palette fields null */
function validateValue(group: TokenGroup, value: {
  paletteId: string | null;
  paletteStep: number | null;
  rawValue: string | null;
}): void {
  if (group === "color") {
    if (!value.paletteId) throw new ValidationError("Color token requires paletteId");
    if (value.paletteStep === null) {
      throw new ValidationError("Color token requires paletteStep");
    }
    if (!ALLOWED_STEPS.has(value.paletteStep)) {
      throw new ValidationError(`Invalid palette step: ${value.paletteStep}`);
    }
    if (value.rawValue !== null) {
      throw new ValidationError("Color token must not have rawValue");
    }
  } else {
    if (!value.rawValue) throw new ValidationError(`${group} token requires rawValue`);
    if (value.paletteId !== null || value.paletteStep !== null) {
      throw new ValidationError(`${group} token must not reference a palette`);
    }
  }
}

export class DesignToken extends AggregateRoot<string> {
  private constructor(private props: DesignTokenProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    group: TokenGroup;
    name: string;
    position: number;
    paletteId?: string | null;
    paletteStep?: number | null;
    rawValue?: string | null;
    description?: string | null;
  }): DesignToken {
    if (!isTokenGroup(input.group)) {
      throw new ValidationError(`Unknown token group: ${input.group}`);
    }
    const value = {
      paletteId: input.paletteId ?? null,
      paletteStep: input.paletteStep ?? null,
      rawValue: input.rawValue !== undefined && input.rawValue !== null
        ? sanitizeRawValue(input.rawValue)
        : null,
    };
    validateValue(input.group, value);
    const now = new Date();
    return new DesignToken({
      id: crypto.randomUUID(),
      productId: input.productId,
      group: input.group,
      name: sanitizeName(input.name),
      position: input.position,
      paletteId: value.paletteId,
      paletteStep: value.paletteStep,
      rawValue: value.rawValue,
      description: sanitizeDescription(input.description),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    group: string;
    name: string;
    position: number;
    paletteId: string | null;
    paletteStep: number | null;
    rawValue: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DesignToken {
    if (!isTokenGroup(raw.group)) {
      throw new Error(`Unknown token group in DB: ${raw.group}`);
    }
    return new DesignToken({ ...raw, group: raw.group });
  }

  get productId(): string {
    return this.props.productId;
  }
  get group(): TokenGroup {
    return this.props.group;
  }
  get name(): string {
    return this.props.name;
  }
  get position(): number {
    return this.props.position;
  }
  get paletteId(): string | null {
    return this.props.paletteId;
  }
  get paletteStep(): number | null {
    return this.props.paletteStep;
  }
  get rawValue(): string | null {
    return this.props.rawValue;
  }
  get description(): string | null {
    return this.props.description;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: string): void {
    this.props = { ...this.props, name: sanitizeName(name), updatedAt: new Date() };
  }

  setColorRef(paletteId: string, paletteStep: number): void {
    if (this.props.group !== "color") {
      throw new ValidationError("Only color tokens can reference a palette");
    }
    const value = { paletteId, paletteStep, rawValue: null };
    validateValue("color", value);
    this.props = { ...this.props, ...value, updatedAt: new Date() };
  }

  setRawValue(rawValue: string): void {
    if (this.props.group === "color") {
      throw new ValidationError("Color tokens cannot use rawValue — set a palette ref instead");
    }
    const value = {
      paletteId: null,
      paletteStep: null,
      rawValue: sanitizeRawValue(rawValue),
    };
    validateValue(this.props.group, value);
    this.props = { ...this.props, ...value, updatedAt: new Date() };
  }

  setDescription(description: string | null): void {
    this.props = {
      ...this.props,
      description: sanitizeDescription(description),
      updatedAt: new Date(),
    };
  }
}
