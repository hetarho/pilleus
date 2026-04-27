import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { createCallerFactory } from "./init";
import { appRouter } from "./routers/_app";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createTRPCContext({ headers: heads });
});

const createCaller = createCallerFactory(appRouter);

export const caller = createCaller(createContext);
