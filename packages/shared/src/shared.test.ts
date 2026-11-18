import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  DEFAULT_SETTINGS,
  ORDER_NUMBER_PATTERN,
  canTransitionOrder,
  formatMoney,
  generateOrderNumber,
  hasPermission,
  isPermission,
  nextOrderStatus,
  settingsSchemas,
  toCents,
} from "./index";

describe("money", () => {
  it("formats cents like the reference ($1,099.00 USD)", () => {
    expect(formatMoney(109900)).toBe("$1,099.00 USD");
    expect(formatMoney(45900, "USD", { withCode: false })).toBe("$459.00");
  });
  it("converts decimals to cents without float drift", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });
});

describe("order number", () => {
  it("uses MJ-YYYYMMDD-XXXX", () => {
    const n = generateOrderNumber(new Date(Date.UTC(2026, 10, 18)), "MJ", () => 0);
    expect(n).toBe("MJ-20261118-AAAA");
    expect(ORDER_NUMBER_PATTERN.test(generateOrderNumber())).toBe(true);
  });
});

describe("order state machine", () => {
  it("allows the happy path and blocks skipping", () => {
    expect(canTransitionOrder("pending", "confirmed")).toBe(true);
    expect(canTransitionOrder("pending", "shipped")).toBe(false);
    expect(canTransitionOrder("delivered", "pending")).toBe(false);
    expect(canTransitionOrder("cancelled", "confirmed")).toBe(false);
    expect(nextOrderStatus("shipped")).toBe("out_for_delivery");
    expect(nextOrderStatus("delivered")).toBeNull();
  });
});

describe("permissions", () => {
  it("owner has everything", () => {
    expect(DEFAULT_ROLES.Owner.permissions).toEqual(ALL_PERMISSIONS);
  });
  it("every role permission is valid", () => {
    for (const role of Object.values(DEFAULT_ROLES))
      for (const p of role.permissions) expect(isPermission(p)).toBe(true);
  });
  it("viewer cannot mutate", () => {
    const viewer = DEFAULT_ROLES.Viewer.permissions;
    expect(viewer.every((p) => p.endsWith(":view"))).toBe(true);
    expect(hasPermission(viewer, "orders:ship")).toBe(false);
  });
  it("manager cannot manage users, roles or settings", () => {
    const m = DEFAULT_ROLES.Manager.permissions;
    expect(m.some((p) => /^(users|roles|settings|audit):/.test(p))).toBe(false);
    expect(hasPermission(m, "orders:refund")).toBe(true);
  });
  it("editor has no orders or customers access", () => {
    const e = DEFAULT_ROLES.Editor.permissions;
    expect(e.some((p) => p.startsWith("orders:") || p.startsWith("customers:"))).toBe(false);
  });
  it("support cannot edit products", () => {
    const s = DEFAULT_ROLES.Support.permissions;
    expect(hasPermission(s, "products:update")).toBe(false);
    expect(hasPermission(s, "orders:ship")).toBe(true);
  });
});

describe("settings", () => {
  it("defaults satisfy their schemas", () => {
    for (const key of Object.keys(settingsSchemas) as (keyof typeof settingsSchemas)[]) {
      expect(settingsSchemas[key].safeParse(DEFAULT_SETTINGS[key]).success).toBe(true);
    }
  });
});
