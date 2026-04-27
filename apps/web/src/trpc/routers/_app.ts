import { createTRPCRouter } from "../init";
import { postRouter } from "./post";

export const appRouter = createTRPCRouter({
  post: postRouter,
});

export type AppRouter = typeof appRouter;
