type Cell = string | number | boolean | Date | null | undefined;

/** One quoted CSV cell, with spreadsheet formula injection neutralised. */
export function csvCell(v: Cell): string {
  const s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const csvRow = (cells: Cell[]) => cells.map(csvCell).join(",");
