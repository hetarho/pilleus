import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { GoogleSignInButton } from "@/features/auth-by-google";

export function SignInView() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </main>
  );
}
