import { createTRPCRouter } from "./shared/trpc/init";
import { userRouter } from "./iam/interface/trpc/user.router";
import { projectRouter } from "./project/interface/trpc/project.router";

export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
