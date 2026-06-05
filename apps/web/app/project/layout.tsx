import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server";
import { AppHeader } from "@/widgets/app-header";

export default async function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Server-side gate: tRPC already protects the data, but bouncing
   * unauthenticated visitors here avoids rendering the workspace shell at all
   * (defense in depth + no flash of empty UI before a client redirect). */
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
