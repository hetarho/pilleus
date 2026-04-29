"use client";

import { useSession } from "@/entities/session";
import { SignOutButton } from "@/features/auth-sign-out";
import { ThemeSwitch } from "@/features/theme-switch";
import { SidebarTrigger } from "@/shared/ui/sidebar";

export function AppHeader() {
  const { data } = useSession();

  return (
    <header className="flex h-14 items-center gap-3 bg-background px-4">
      {/* Hamburger only on mobile — desktop has its own trigger inside the sidebar header.
       * Tailwind `md:` breakpoint (768px) aligns with shadcn sidebar's mobile threshold. */}
      <SidebarTrigger className="md:hidden" />
      <div className="ml-auto flex items-center gap-2">
        {data?.user && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {data.user.name}
          </span>
        )}
        <ThemeSwitch />
        {data?.user && <SignOutButton />}
      </div>
    </header>
  );
}
