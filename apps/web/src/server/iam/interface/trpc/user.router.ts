import { createTRPCRouter, protectedProcedure } from "../../../shared/trpc/init";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user";
import { DrizzleUserRepository } from "../../infrastructure/repositories/drizzle-user-repository";
import type { User } from "../../domain/entities/user";

const userRepository = new DrizzleUserRepository();

const toDTO = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email.value,
  emailVerified: u.emailVerified,
  image: u.image,
});

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const useCase = new GetCurrentUserUseCase(userRepository);
    const user = await useCase.execute(ctx.user.id);
    return toDTO(user);
  }),
});
