import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { appRouter, createCallerFactory, createContext } from "@/server";

const getContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createContext({ headers: heads });
});

const createCaller = createCallerFactory(appRouter);

export const caller = createCaller(getContext);
