import { createTRPCRouter } from "./shared/trpc/init";
import { userRouter } from "./iam/interface/trpc/user.router";
import { productRouter } from "./product/interface/trpc/product.router";
import { designRouter } from "./design/interface/trpc/design.router";
import { policyRouter } from "./policy/interface/trpc/policy.router";
import { referenceRouter } from "./reference/interface/trpc/reference.router";
import { llmRouter } from "./llm/interface/trpc/llm.router";

export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
  design: designRouter,
  policy: policyRouter,
  reference: referenceRouter,
  llm: llmRouter,
});

export type AppRouter = typeof appRouter;
