"use client";

import { useSession } from "@/entities/session";
import { SignOutButton } from "@/features/auth-sign-out";

export function DashboardHeader() {
  const { data } = useSession();
  if (!data?.user) return null;

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {data.user.name} ({data.user.email})
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}
