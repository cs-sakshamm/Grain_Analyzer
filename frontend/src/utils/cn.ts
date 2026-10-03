/**
 * Joins conditional class names, skipping falsy values.
 * Keeps components free of external class-utility dependencies.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
