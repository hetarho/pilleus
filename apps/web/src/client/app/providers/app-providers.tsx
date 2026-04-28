"use client";

import { TRPCReactProvider } from "@/shared/api/trpc/client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
