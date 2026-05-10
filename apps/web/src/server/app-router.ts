import { createTRPCRouter } from "./shared/trpc/init";
import { userRouter } from "./iam/interface/trpc/user.router";
import { productRouter } from "./product/interface/trpc/product.router";
import { designRouter } from "./design/interface/trpc/design.router";

export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
  design: designRouter,
});

export type AppRouter = typeof appRouter;
