import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Project = RouterOutputs["project"]["list"][number];
