"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/entities/session";

export function DashboardView() {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.push("/sign-in");
    }
  }, [isPending, data, router]);

  if (isPending || !data?.user) {
    return null;
  }

  return (
    <main className="flex flex-1 items-center justify-center">
      <h1 className="text-6xl font-bold tracking-tight">Pilleus</h1>
    </main>
  );
}
