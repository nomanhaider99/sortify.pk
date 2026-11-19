"use server";

import { LOCKED_ERROR, LOGIN_ERROR } from "@repo/shared";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string | null };

/** Only same-site relative paths are allowed as post-login targets (no open redirects). */
function safeCallback(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      return { error: code === "locked" ? LOCKED_ERROR : LOGIN_ERROR };
    }
    throw error; // NEXT_REDIRECT on success
  }
}
