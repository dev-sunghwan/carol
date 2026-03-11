import { z } from "zod";

export type OrderError =
  | { code: "NOT_AUTHENTICATED" }
  | { code: "NOT_ALLOWED" }
  | { code: "CUTOFF_PASSED"; cutoffAt: Date }
  | { code: "DUPLICATE_ORDER"; existingOrderId: string }
  | { code: "MENU_ITEM_NOT_FOUND" }
  | { code: "MENU_ITEM_UNAVAILABLE" }
  | { code: "ORDER_NOT_FOUND" }
  | { code: "NOT_OWNER" }
  | { code: "INVALID_STATUS" }
  | { code: "DB_ERROR"; message: string };

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: OrderError };

export const placeOrderSchema = z.object({
  menuItemId: z.string().uuid(),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
});

export const exceptionRequestSchema = z.object({
  orderId: z.string().uuid().optional(),
  requestType: z.enum(["late_cancel", "late_order", "other"]),
  reason: z.string().min(10, "Please provide more detail (at least 10 characters)."),
});
