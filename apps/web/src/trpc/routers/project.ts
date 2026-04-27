import { z } from "zod";
import { db, eq } from "@pilleus/db";
import { project } from "@pilleus/db/schema";
import { createTRPCRouter, protectedProcedure } from "../init";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(project).where(eq(project.userId, ctx.user.id));
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await db
        .insert(project)
        .values({ name: input.name, description: input.description ?? null, userId: ctx.user.id })
        .returning();
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(project)
        .where(eq(project.id, input.id));
    }),
});
