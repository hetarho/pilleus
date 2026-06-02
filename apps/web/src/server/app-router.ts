import { createTRPCRouter } from "./shared/trpc/init";
import { userRouter } from "./iam/interface/trpc/user.router";
import { productRouter } from "./product/interface/trpc/product.router";
import { designRouter } from "./design/interface/trpc/design.router";
import { policyRouter } from "./policy/interface/trpc/policy.router";

export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
  design: designRouter,
  policy: policyRouter,
});

export type AppRouter = typeof appRouter;
