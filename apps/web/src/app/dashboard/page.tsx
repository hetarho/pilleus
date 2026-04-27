"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const isAuthenticated = !!sessionData?.user;

  const projectsQuery = useQuery({
    ...trpc.project.list.queryOptions(),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation(
    trpc.project.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.project.list.queryKey() });
        setName("");
        setDescription("");
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.project.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.project.list.queryKey() });
      },
    })
  );

  useEffect(() => {
    if (!sessionLoading && !sessionData?.user) {
      router.push("/sign-in");
    }
  }, [sessionLoading, sessionData, router]);

  if (sessionLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!sessionData?.user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{sessionData.user.name} ({sessionData.user.email})</p>
        </div>
        <Button variant="outline" onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push("/sign-in") } })}>
          Sign Out
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createMutation.mutate({ name, description: description || undefined });
            }}
          >
            <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-semibold">Projects</h2>
      {projectsQuery.isLoading && <p>Loading projects...</p>}
      {projectsQuery.data?.length === 0 && <p className="text-muted-foreground">No projects yet.</p>}
      <div className="flex flex-col gap-3">
        {projectsQuery.data?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{p.name}</p>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate({ id: p.id })}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
