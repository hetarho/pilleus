import { createTRPCRouter } from "../init";
import { postRouter } from "./post";
import { projectRouter } from "./project";

export const appRouter = createTRPCRouter({
  post: postRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
