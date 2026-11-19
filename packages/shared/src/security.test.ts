import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLES,
  hasPermission,
  isIdle,
  isLockedOut,
  LOCKOUT,
  ownerGuard,
  SESSION,
} from "./index";

describe("lockout", () => {
  it("locks after the per-email threshold", () => {
    expect(isLockedOut({ byEmail: LOCKOUT.maxFailuresPerEmail - 1, byIp: 0 })).toBe(false);
    expect(isLockedOut({ byEmail: LOCKOUT.maxFailuresPerEmail, byIp: 0 })).toBe(true);
  });
  it("locks after the per-IP threshold", () => {
    expect(isLockedOut({ byEmail: 0, byIp: LOCKOUT.maxFailuresPerIp })).toBe(true);
  });
});

describe("idle timeout", () => {
  it("rejects sessions idle longer than the limit", () => {
    const now = 1_000_000_000;
    expect(isIdle(now - SESSION.idleTimeoutMs + 1, now)).toBe(false);
    expect(isIdle(now - SESSION.idleTimeoutMs - 1, now)).toBe(true);
    expect(isIdle(undefined, now)).toBe(false);
  });
});

describe("owner guard", () => {
  it("blocks removing the last active owner", () => {
    for (const change of ["disable", "demote", "delete"] as const) {
      expect(ownerGuard({ targetIsActiveOwner: true, activeOwnerCount: 1, change })).toMatch(
        /last active Owner/,
      );
    }
  });
  it("allows it when another owner exists, or the target isn't an owner", () => {
    expect(
      ownerGuard({ targetIsActiveOwner: true, activeOwnerCount: 2, change: "disable" }),
    ).toBeNull();
    expect(
      ownerGuard({ targetIsActiveOwner: false, activeOwnerCount: 1, change: "delete" }),
    ).toBeNull();
  });
});

describe("RBAC matrix (PLAN §6.3 / §8 RBAC flow)", () => {
  const can = (role: keyof typeof DEFAULT_ROLES, p: Parameters<typeof hasPermission>[1]) =>
    hasPermission(DEFAULT_ROLES[role].permissions, p);

  it("only Owner manages users, roles, settings and the audit log", () => {
    for (const p of [
      "users:create",
      "users:invite",
      "roles:update",
      "settings:update",
      "audit:view",
    ] as const) {
      expect(can("Owner", p)).toBe(true);
      for (const r of ["Manager", "Editor", "Support", "Viewer"] as const)
        expect(can(r, p)).toBe(false);
    }
  });
  it("Editor sees products/categories/reviews but not orders (Sara flow)", () => {
    expect(can("Editor", "products:update")).toBe(true);
    expect(can("Editor", "categories:create")).toBe(true);
    expect(can("Editor", "reviews:view")).toBe(true);
    expect(can("Editor", "reviews:moderate")).toBe(false);
    expect(can("Editor", "orders:view")).toBe(false);
  });
  it("Support can run fulfilment but not refunds", () => {
    expect(can("Support", "orders:confirm")).toBe(true);
    expect(can("Support", "orders:ship")).toBe(true);
    expect(can("Support", "orders:refund")).toBe(false);
  });
  it("Viewer has no mutating permission at all", () => {
    expect(DEFAULT_ROLES.Viewer.permissions.some((p) => !p.endsWith(":view"))).toBe(false);
  });
});
