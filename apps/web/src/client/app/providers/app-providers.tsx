"use client";

import { TRPCReactProvider } from "@/shared/api/trpc/client";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TRPCReactProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
