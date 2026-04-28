"use client";

import { signIn } from "@/shared/api/auth/client";
import { Button } from "@/shared/ui/button";

interface GoogleSignInButtonProps {
  callbackURL?: string;
}

export function GoogleSignInButton({ callbackURL = "/dashboard" }: GoogleSignInButtonProps) {
  return (
    <Button
      className="w-full"
      size="lg"
      onClick={() => signIn.social({ provider: "google", callbackURL })}
    >
      Continue with Google
    </Button>
  );
}
