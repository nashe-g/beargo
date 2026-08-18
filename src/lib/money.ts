export function dollarsFromCents(cents: number) {
  return cents / 100;
}

export function centsFromDollars(dollars: number) {
  return Math.round(dollars * 100);
}

export function iso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

export function isoRequired(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
