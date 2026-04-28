import { auth } from "../../iam/infrastructure/auth/better-auth";

export const createContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers });
  return {
    headers,
    session,
    user: session?.user ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
