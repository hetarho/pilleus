import { AggregateRoot } from "../../../shared/domain/aggregate-root";
import { ProjectName } from "../value-objects/project-name";

interface ProjectProps {
  id: string;
  name: ProjectName;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project extends AggregateRoot<string> {
  private constructor(private props: ProjectProps) {
    super(props.id);
  }

  static create(input: { name: string; description?: string | null; userId: string }): Project {
    const now = new Date();
    return new Project({
      id: crypto.randomUUID(),
      name: ProjectName.create(input.name),
      description: input.description?.trim() || null,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(raw: {
    id: string;
    name: string;
    description: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return new Project({
      id: raw.id,
      name: ProjectName.create(raw.name),
      description: raw.description,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  get name(): ProjectName {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
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
    this.props = { ...this.props, name: ProjectName.create(name), updatedAt: new Date() };
  }

  describe(description: string | null): void {
    this.props = { ...this.props, description: description?.trim() || null, updatedAt: new Date() };
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }
}
