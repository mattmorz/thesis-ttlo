import { z } from "zod";
import { router } from "@/trpc/init";
import { formIntegrationRouter as clientRouter } from "../trpc";

// Export the router from trpc.ts file
export const formIntegrationRouter = clientRouter;
