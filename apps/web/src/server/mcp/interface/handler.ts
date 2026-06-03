import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { auth } from "../../iam/infrastructure/auth/better-auth";

const handler = createMcpHandler((server) => {
  server.tool("hello", "Say hello", { name: z.string() }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));
});

/* The MCP transport is unauthenticated by default. Require a valid session
 * before delegating so tools can't be invoked anonymously — and so that, once
 * tools touching product data land, the authenticated user is available to
 * enforce ownership the same way the tRPC procedures do. */
export const mcpHandler = async (req: Request): Promise<Response> => {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  return handler(req);
};
