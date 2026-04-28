import { createAuthClient } from "better-auth/react";
import { env } from "@/shared/config/env";

export const authClient = createAuthClient({
  baseURL: env.appUrl,
});

export const { signIn, signUp, signOut, useSession } = authClient;
