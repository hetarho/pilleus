"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/entities/session";
import { CreateProjectForm } from "@/features/project-create";
import { DashboardHeader } from "@/widgets/dashboard-header";
import { ProjectList } from "@/widgets/project-list";

export function DashboardView() {
  const router = useRouter();
  const { data, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.push("/sign-in");
    }
  }, [isPending, data, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">Loading...</div>
    );
  }

  if (!data?.user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <DashboardHeader />
      <div className="mb-8">
        <CreateProjectForm />
      </div>
      <ProjectList />
    </main>
  );
}
