"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/entities/session";
import { CreateProjectForm } from "@/features/project-create";
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
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data?.user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-8">
        <CreateProjectForm />
      </div>
      <ProjectList />
    </main>
  );
}
