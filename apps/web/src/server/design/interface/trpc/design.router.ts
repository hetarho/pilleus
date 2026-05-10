import { createTRPCRouter } from "../../../shared/trpc/init";
import { designTokenRouter } from "./design-token.router";
import { paletteRouter } from "./palette.router";

export const designRouter = createTRPCRouter({
  palette: paletteRouter,
  token: designTokenRouter,
});
