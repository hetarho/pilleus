import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ValidationError } from "../../../shared/errors/domain-error";
import { canReference, type ReferenceKind } from "@/kernel/reference";

interface ReferenceProps {
  id: string;
  productId: string;
  sourceKind: ReferenceKind;
  sourceId: string;
  targetKind: ReferenceKind;
  targetId: string;
  createdAt: Date;
}

export class Reference extends AggregateRoot<string> {
  private constructor(private props: ReferenceProps) {
    super(props.id);
  }

  static create(input: {
    productId: string;
    sourceKind: ReferenceKind;
    sourceId: string;
    targetKind: ReferenceKind;
    targetId: string;
  }): Reference {
    if (!canReference(input.sourceKind, input.targetKind)) {
      throw new ValidationError(
        `A ${input.sourceKind} cannot import a ${input.targetKind}: references must point inward, toward a more stable ring`,
      );
    }
    if (input.sourceKind === input.targetKind && input.sourceId === input.targetId) {
      throw new ValidationError("A concept cannot reference itself");
    }
    return new Reference({
      id: crypto.randomUUID(),
      productId: input.productId,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      targetKind: input.targetKind,
      targetId: input.targetId,
      createdAt: new Date(),
    });
  }

  static reconstitute(raw: {
    id: string;
    productId: string;
    sourceKind: ReferenceKind;
    sourceId: string;
    targetKind: ReferenceKind;
    targetId: string;
    createdAt: Date;
  }): Reference {
    return new Reference({ ...raw });
  }

  get productId(): string {
    return this.props.productId;
  }
  get sourceKind(): ReferenceKind {
    return this.props.sourceKind;
  }
  get sourceId(): string {
    return this.props.sourceId;
  }
  get targetKind(): ReferenceKind {
    return this.props.targetKind;
  }
  get targetId(): string {
    return this.props.targetId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
