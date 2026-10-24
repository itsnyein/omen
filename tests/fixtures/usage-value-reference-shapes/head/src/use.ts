import { formatRow } from "./format.js";

export function asArgument(rows: string[]): string[] {
  return rows.map(formatRow);
}

export const held = formatRow;

export const inArray = [formatRow];

export function wrapped(): (value: string) => string {
  return memo(formatRow);
}

export function called(row: string): string {
  return formatRow(row);
}

function memo(fn: (value: string) => string): (value: string) => string {
  return fn;
}
