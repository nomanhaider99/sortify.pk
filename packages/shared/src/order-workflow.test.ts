import { describe, expect, it } from "vitest";
import { nextAction, permissionForTransition, planTransition } from "./order-workflow";

const cod = { paymentMethod: "cod" as const, paymentStatus: "pending" as const };
const card = { paymentMethod: "card_demo" as const, paymentStatus: "paid" as const };

describe("order workflow", () => {
  it("walks the happy path with the right next actions", () => {
    expect(nextAction("pending")).toEqual({ to: "confirmed", label: "Confirm order" });
    expect(nextAction("processing")).toEqual({ to: "shipped", label: "Mark as shipped" });
    expect(nextAction("delivered")).toBeNull();
  });

  it("rejects invalid transitions", () => {
    expect(() => planTransition({ status: "pending", ...cod }, "delivered")).toThrow(/Can't move/);
    expect(() => planTransition({ status: "cancelled", ...cod }, "confirmed")).toThrow();
  });

  it("marks COD paid on delivery", () => {
    const p = planTransition({ status: "out_for_delivery", ...cod }, "delivered");
    expect(p).toMatchObject({ timestamp: "deliveredAt", paymentStatus: "paid", restock: false });
  });

  it("restocks on cancel and refunds a paid card", () => {
    expect(planTransition({ status: "confirmed", ...card }, "cancelled")).toMatchObject({
      restock: true,
      paymentStatus: "refunded",
      timestamp: "cancelledAt",
    });
    expect(planTransition({ status: "pending", ...cod }, "cancelled").paymentStatus).toBeNull();
  });

  it("maps transitions to permissions", () => {
    expect(permissionForTransition("confirmed")).toBe("orders:confirm");
    expect(permissionForTransition("shipped")).toBe("orders:ship");
    expect(permissionForTransition("refunded")).toBe("orders:refund");
    expect(permissionForTransition("cancelled")).toBe("orders:cancel");
  });
});
