/** Reads a string field from FormData ("" for missing or file values). */
export function formString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
