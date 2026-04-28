import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";

export const mcpHandler = createMcpHandler((server) => {
  server.tool("hello", "Say hello", { name: z.string() }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));
});
