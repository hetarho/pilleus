import { createTRPCRouter } from "../../../shared/trpc/init";
import { paletteRouter } from "./palette.router";

export const designRouter = createTRPCRouter({
  palette: paletteRouter,
});
