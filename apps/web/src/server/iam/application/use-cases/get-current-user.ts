import { NotFoundError } from "../../../shared/errors/domain-error";
import type { User } from "../../domain/entities/user";
import type { UserRepository } from "../../domain/repositories/user-repository";

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`);
    }
    return user;
  }
}
