import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";

const handler = createMcpHandler((server) => {
  server.tool("hello", "Say hello", { name: z.string() }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));
});

export { handler as GET, handler as POST, handler as DELETE };
