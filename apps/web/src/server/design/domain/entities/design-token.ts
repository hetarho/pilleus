import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import {
  isTokenGroup,
  type TokenGroup,
} from "../../../../client/entities/design-token";
import { SHADE_STEPS } from "../../../../client/entities/palette";

interface DesignTokenProps {
  id: string;
  productId: string;
  group: TokenGroup;
  name: string;
  position: number;
  paletteId: string | null;
  paletteStep: number | null;
  rawValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const sanitizeName = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new Error("Token name must not be empty");
  if (trimmed.length > 80) throw new Error("Token name is too long");
  return trimmed;
};

const sanitizeRawValue = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new Error("Token value must not be empty");
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
    if (!value.paletteId) throw new Error("Color token requires paletteId");
    if (value.paletteStep === null) {
      throw new Error("Color token requires paletteStep");
    }
    if (!ALLOWED_STEPS.has(value.paletteStep)) {
      throw new Error(`Invalid palette step: ${value.paletteStep}`);
    }
    if (value.rawValue !== null) {
      throw new Error("Color token must not have rawValue");
    }
  } else {
    if (!value.rawValue) throw new Error(`${group} token requires rawValue`);
    if (value.paletteId !== null || value.paletteStep !== null) {
      throw new Error(`${group} token must not reference a palette`);
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
  }): DesignToken {
    if (!isTokenGroup(input.group)) {
      throw new Error(`Unknown token group: ${input.group}`);
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
      throw new Error("Only color tokens can reference a palette");
    }
    const value = { paletteId, paletteStep, rawValue: null };
    validateValue("color", value);
    this.props = { ...this.props, ...value, updatedAt: new Date() };
  }

  setRawValue(rawValue: string): void {
    if (this.props.group === "color") {
      throw new Error("Color tokens cannot use rawValue — set a palette ref instead");
    }
    const value = {
      paletteId: null,
      paletteStep: null,
      rawValue: sanitizeRawValue(rawValue),
    };
    validateValue(this.props.group, value);
    this.props = { ...this.props, ...value, updatedAt: new Date() };
  }
}
