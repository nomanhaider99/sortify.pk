export const RESOURCES = [
  "dashboard",
  "orders",
  "products",
  "categories",
  "customers",
  "reviews",
  "messages",
  "users",
  "roles",
  "settings",
  "audit",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const CRUD_ACTIONS = ["view", "create", "update", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

/** Special, non-CRUD permissions. */
export const SPECIAL_PERMISSIONS = [
  "orders:confirm",
  "orders:ship",
  "orders:refund",
  "orders:cancel",
  "reviews:moderate",
  "products:publish",
  "users:invite",
  "data:export",
] as const;

type CrudPermission = `${Resource}:${CrudAction}`;
export type Permission = CrudPermission | (typeof SPECIAL_PERMISSIONS)[number];

/** Resources where only some CRUD actions make sense. */
const RESOURCE_ACTIONS: Record<Resource, readonly CrudAction[]> = {
  dashboard: ["view"],
  orders: ["view", "create", "update", "delete"],
  products: ["view", "create", "update", "delete"],
  categories: ["view", "create", "update", "delete"],
  customers: ["view", "create", "update", "delete"],
  reviews: ["view", "create", "update", "delete"],
  messages: ["view", "update", "delete"],
  users: ["view", "create", "update", "delete"],
  roles: ["view", "create", "update", "delete"],
  settings: ["view", "update"],
  audit: ["view"],
};

export const ALL_PERMISSIONS: readonly Permission[] = [
  ...RESOURCES.flatMap((r) => RESOURCE_ACTIONS[r].map((a) => `${r}:${a}` as Permission)),
  ...SPECIAL_PERMISSIONS,
];

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

/** Permissions grouped by resource, for the admin permission-matrix editor. */
export const PERMISSION_GROUPS: ReadonlyArray<{
  resource: Resource | "data";
  permissions: Permission[];
}> = [
  ...RESOURCES.map((resource) => ({
    resource,
    permissions: ALL_PERMISSIONS.filter((p) => p.startsWith(`${resource}:`)),
  })),
  { resource: "data", permissions: ["data:export"] },
];

function crud(resource: Resource, actions: readonly CrudAction[] = RESOURCE_ACTIONS[resource]) {
  return actions.map((a) => `${resource}:${a}` as Permission);
}

export const SYSTEM_ROLE_NAMES = ["Owner", "Manager", "Editor", "Support", "Viewer"] as const;
export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];

export const OWNER_ROLE: SystemRoleName = "Owner";

export const DEFAULT_ROLES: Record<
  SystemRoleName,
  { description: string; permissions: readonly Permission[] }
> = {
  Owner: {
    description: "Full access, including users, roles, settings and the audit log.",
    permissions: ALL_PERMISSIONS,
  },
  Manager: {
    description: "All store operations. No user, role or settings management.",
    permissions: [
      "dashboard:view",
      ...crud("orders"),
      "orders:confirm",
      "orders:ship",
      "orders:refund",
      "orders:cancel",
      ...crud("products"),
      "products:publish",
      ...crud("categories"),
      ...crud("customers"),
      ...crud("reviews"),
      "reviews:moderate",
      ...crud("messages"),
      "data:export",
    ],
  },
  Editor: {
    description: "Create and update products and categories; view reviews.",
    permissions: [
      "dashboard:view",
      "products:view",
      "products:create",
      "products:update",
      "categories:view",
      "categories:create",
      "categories:update",
      "reviews:view",
    ],
  },
  Support: {
    description: "Handle orders, customers, reviews and messages. No product pricing edits.",
    permissions: [
      "dashboard:view",
      "orders:view",
      "orders:update",
      "orders:confirm",
      "orders:ship",
      "customers:view",
      "products:view",
      "reviews:view",
      "reviews:moderate",
      "messages:view",
      "messages:update",
      "messages:delete",
    ],
  },
  Viewer: {
    description: "Read-only access to dashboard, orders, products and reviews.",
    permissions: ["dashboard:view", "orders:view", "products:view", "reviews:view"],
  },
};

export function hasPermission(
  granted: Iterable<string> | null | undefined,
  required: Permission,
): boolean {
  if (!granted) return false;
  for (const p of granted) if (p === required) return true;
  return false;
}

export function hasAllPermissions(
  granted: Iterable<string> | null | undefined,
  required: readonly Permission[],
): boolean {
  const set = new Set(granted ?? []);
  return required.every((p) => set.has(p));
}
