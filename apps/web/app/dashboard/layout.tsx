import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { AppHeader } from "@/widgets/app-header";
import { AppSidebar } from "@/widgets/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Server-side gate: tRPC already protects the data, but bouncing
   * unauthenticated visitors here avoids rendering the dashboard shell at
   * all (defense in depth + no flash of empty UI before a client redirect). */
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
