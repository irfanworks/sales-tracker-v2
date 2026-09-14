/**
 * Validasi password kuat:
 * - Min 8 karakter
 * - Min 1 huruf besar
 * - Min 1 huruf kecil
 * - Min 1 angka
 * - Min 1 karakter spesial (!@#$%^&* dll)
 */
const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validateStrongPassword(password: string): PasswordValidation {
  const errors: string[] = [];
  if (password.length < MIN_LENGTH) {
    errors.push(`Minimal ${MIN_LENGTH} karakter`);
  }
  if (!HAS_UPPER.test(password)) {
    errors.push("Minimal 1 huruf besar (A-Z)");
  }
  if (!HAS_LOWER.test(password)) {
    errors.push("Minimal 1 huruf kecil (a-z)");
  }
  if (!HAS_NUMBER.test(password)) {
    errors.push("Minimal 1 angka (0-9)");
  }
  if (!HAS_SPECIAL.test(password)) {
    errors.push("Minimal 1 karakter spesial (!@#$%^&* dll)");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
