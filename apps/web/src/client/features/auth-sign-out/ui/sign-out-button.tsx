"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/shared/api/auth/client";
import { Button } from "@/shared/ui/button";

export function SignOutButton({ redirectTo = "/sign-in" }: { redirectTo?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() =>
        signOut({
          fetchOptions: { onSuccess: () => router.push(redirectTo) },
        })
      }
    >
      Sign Out
    </Button>
  );
}
