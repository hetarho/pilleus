import { createTRPCRouter } from "./shared/trpc/init";
import { userRouter } from "./iam/interface/trpc/user.router";
import { productRouter } from "./product/interface/trpc/product.router";

export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
});

export type AppRouter = typeof appRouter;
