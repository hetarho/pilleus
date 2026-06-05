import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server";
import { AppHeader } from "@/widgets/app-header";

/* Account/settings shell. Mirrors the project layout's auth gate + header so
 * the my-page lives under the same authenticated chrome, app-wide (not
 * project-scoped). */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
