import { Entity } from "../../../shared/domain/entity";
import { Email } from "../value-objects/email";

interface UserProps {
  id: string;
  name: string;
  email: Email;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<string> {
  private constructor(private readonly props: UserProps) {
    super(props.id);
  }

  static reconstitute(raw: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: raw.id,
      name: raw.name,
      email: Email.create(raw.email),
      emailVerified: raw.emailVerified,
      image: raw.image,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get image(): string | null {
    return this.props.image;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
