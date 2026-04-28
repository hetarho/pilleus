// Composition root — public API of the server package

export { appRouter, type AppRouter } from "./app-router";

// tRPC infrastructure
export { createContext, type Context } from "./shared/trpc/context";
export { createCallerFactory } from "./shared/trpc/init";

// Auth (Better Auth instance — used by Next.js route handler)
export { auth, type Session } from "./iam/infrastructure/auth/better-auth";

// MCP handler
export { mcpHandler } from "./mcp/interface/handler";

// Domain errors (for any direct consumers)
export {
  DomainError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "./shared/errors/domain-error";
