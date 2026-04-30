import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Product = RouterOutputs["product"]["list"][number];
