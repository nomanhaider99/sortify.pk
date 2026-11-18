import { hash, verify } from "@node-rs/argon2";

// argon2id with OWASP-recommended parameters (19 MiB, 2 iterations, 1 lane).
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

/** Admin password policy: ≥ 10 chars with upper, lower, digit and symbol. */
export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push("at least 10 characters");
  if (!/[a-z]/.test(password)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
  if (!/\d/.test(password)) errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("a symbol");
  return errors;
}
