export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function allowedEmailDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN || "hemp.com").trim().toLowerCase().replace(/^@/, "");
}

export function isEmailAllowed(value: string): boolean {
  const email = normalizeEmail(value);
  return email.endsWith(`@${allowedEmailDomain()}`) && email.length > allowedEmailDomain().length + 1;
}

export function validatePassword(value: string): string | null {
  if (value.length < 10) return "Password must be at least 10 characters long.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return "Password must contain uppercase, lowercase, and numeric characters.";
  }
  return null;
}
