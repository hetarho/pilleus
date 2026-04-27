"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn.social({ provider: "google", callbackURL: "/dashboard" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
