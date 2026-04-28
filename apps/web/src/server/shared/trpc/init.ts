import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { ConflictError, DomainError, ForbiddenError, NotFoundError, ValidationError } from "../errors/domain-error";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.format() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const domainErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message, cause: err });
    }
    if (err instanceof ForbiddenError) {
      throw new TRPCError({ code: "FORBIDDEN", message: err.message, cause: err });
    }
    if (err instanceof ValidationError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: err.message, cause: err });
    }
    if (err instanceof ConflictError) {
      throw new TRPCError({ code: "CONFLICT", message: err.message, cause: err });
    }
    if (err instanceof DomainError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: err.message, cause: err });
    }
    throw err;
  }
});

export const publicProcedure = t.procedure.use(domainErrorMiddleware);

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
