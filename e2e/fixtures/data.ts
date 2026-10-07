/**
 * Fixture data helpers.
 *
 * Specs run against a shared database, so every generated name carries a unique
 * suffix. That keeps parallel workers from colliding on the unique slug column
 * and lets a spec clean up after itself by name.
 */

function suffix(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8);
}

function unique(prefix: string, label: string): string {
  return `${prefix} ${label} ${suffix()}`;
}

export function uniqueName(label: string): string {
  return unique("E2E", label);
}

/**
 * Review bodies need to be unique per run: specs assert on a single matching
 * review card, and earlier runs may have left identical text behind.
 */
export function uniqueText(label: string): string {
  return unique("E2E", label);
}

export function uniqueEmail(label: string): string {
  return `e2e-${label}-${suffix()}@example.test`;
}

/** Passwords must be at least 8 characters (CustomerAuthService.register). */
export function testPassword(): string {
  return `Pw-${suffix()}!`;
}

export type OrderDetails = {
  email: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  phone?: string;
  notes?: string;
};

export function guestOrderDetails(): OrderDetails {
  return {
    email: uniqueEmail("order"),
    name: "E2E Guest",
    address: "1 Test Street",
    city: "Testville",
    postalCode: "10001",
    country: "Testland",
    phone: "+1 555 0100",
    notes: "Automated end-to-end order.",
  };
}
