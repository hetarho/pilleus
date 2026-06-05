"use client";

import Link from "next/link";
import { useSession } from "@/entities/session";
import { SignOutButton } from "@/features/auth-sign-out";
import { ThemeSwitch } from "@/features/theme-switch";
import { ProjectSwitcher } from "./project-switcher";

/* Top bar for the project workspace. The sidebar is gone; project navigation
 * now lives in the centered ProjectSwitcher dropdown. Logo sits left, account
 * controls right, switcher absolutely centered so it stays put regardless of
 * how wide the side regions get. */
export function AppHeader() {
  const { data } = useSession();

  return (
    <header className="relative flex h-14 items-center gap-3 border-b bg-background px-4">
      <Link href="/project" className="text-base font-semibold">
        Pilleus
      </Link>

      <div className="pointer-events-none absolute inset-x-0 flex justify-center">
        <div className="pointer-events-auto">
          <ProjectSwitcher />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {data?.user && (
          <Link
            href="/account"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            {data.user.name}
          </Link>
        )}
        <ThemeSwitch />
        {data?.user && <SignOutButton />}
      </div>
    </header>
  );
}
