import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@pilleus/db";

/* Origins allowed to initiate auth requests. Filtering out unset env vars
 * avoids injecting a literal "undefined" origin, which would silently break
 * the CSRF/origin check. When developing over a LAN IP or a tunnel, point
 * NEXT_PUBLIC_APP_URL / BETTER_AUTH_URL at that origin so the client (which
 * calls the auth API at NEXT_PUBLIC_APP_URL) and this trust list agree —
 * a mismatch is the usual cause of "sign-in does nothing". */
const trustedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BETTER_AUTH_URL,
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
