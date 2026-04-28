import { db, eq } from "@pilleus/db";
import { user as userTable } from "@pilleus/db/schema";
import { User } from "../../domain/entities/user";
import type { UserRepository } from "../../domain/repositories/user-repository";

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
    return row ? User.reconstitute(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    return row ? User.reconstitute(row) : null;
  }
}
