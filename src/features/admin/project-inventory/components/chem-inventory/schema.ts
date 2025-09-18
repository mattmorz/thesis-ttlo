import { z } from "zod";
import { baseInventorySchema } from "../../schemas/inventory-base";

export const inventorySchema = baseInventorySchema.extend({
  ipType: z.enum(["Patent", "Copyright", "Trade Secret"]),
  applicationNo: z.string().optional(),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
