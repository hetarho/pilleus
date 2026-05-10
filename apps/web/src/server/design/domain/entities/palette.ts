import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import {
  generateShades,
  normalizeHex,
  type Shade,
} from "../../../../client/entities/palette/lib/oklch-scale";

interface PaletteProps {
  id: string;
  productId: string;
  name: string;
  seedHex: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const sanitizeName = (s: string): string => {
  const trimmed = s.trim();
  if (trimmed.length === 0) throw new Error("Palette name must not be empty");
  if (trimmed.length > 50) throw new Error("Palette name is too long");
  return trimmed;
};

export class Palette extends AggregateRoot<string> {
  private constructor(private props: PaletteProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    name: string;
    seedHex: string;
    position: number;
  }): Palette {
    const now = new Date();
    return new Palette({
      id: crypto.randomUUID(),
      productId: input.productId,
      name: sanitizeName(input.name),
      seedHex: normalizeHex(input.seedHex),
      position: input.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    name: string;
    seedHex: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Palette {
    return new Palette({ ...raw });
  }

  get productId(): string {
    return this.props.productId;
  }
  get name(): string {
    return this.props.name;
  }
  get seedHex(): string {
    return this.props.seedHex;
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

  rename(name: string): void {
    this.props = { ...this.props, name: sanitizeName(name), updatedAt: new Date() };
  }

  changeSeed(seedHex: string): void {
    this.props = { ...this.props, seedHex: normalizeHex(seedHex), updatedAt: new Date() };
  }

  reorder(position: number): void {
    this.props = { ...this.props, position, updatedAt: new Date() };
  }

  /** Derive the 50..950 shade ramp from the current seed. Pure read-side
   * computation — never persisted. */
  shades(): Shade[] {
    return generateShades(this.props.seedHex);
  }
}
