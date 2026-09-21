/**
 * Form validation utilities — shared across all auth pages.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/* ---------- Email ---------- */
export function validateEmail(email: string): ValidationResult {
  if (!email) return { valid: false, error: 'Email is required' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return { valid: false, error: 'Please enter a valid email' };
  return { valid: true };
}

/* ---------- Kenyan Phone ----------
   Accepts: 0712345678, +254712345678, 254712345678, 712345678
   Returns normalized: +254712345678
*/
export function validateKenyanPhone(phone: string): ValidationResult {
  if (!phone) return { valid: false, error: 'Phone number is required' };

  const cleaned = phone.replace(/\s/g, '');

  // 0712345678 — 10 digits starting with 0
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return { valid: true };
  }

  // +254712345678 — starts with +254 followed by 9 digits
  if (/^\+254[17]\d{8}$/.test(cleaned)) {
    return { valid: true };
  }

  // 254712345678 — starts with 254 followed by 9 digits
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return { valid: true };
  }

  // 712345678 — 9 digits starting with 7 or 1
  if (/^[17]\d{8}$/.test(cleaned)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Enter a valid Kenyan number (e.g., 0712345678)',
  };
}

/* ---------- Normalize phone for API ---------- */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1);
  if (cleaned.startsWith('254')) return '+' + cleaned;
  if (cleaned.startsWith('+254')) return cleaned;
  if (/^[17]\d{8}$/.test(cleaned)) return '+254' + cleaned;
  return cleaned;
}

/* ---------- Password ---------- */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'At least 8 characters required' };
  if (password.length > 100) return { valid: false, error: 'Password too long' };
  return { valid: true };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: 'Very Weak', color: 'bg-slate-300' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<number, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };
  const colors: Record<number, string> = {
    0: 'bg-slate-300',
    1: 'bg-red-400',
    2: 'bg-orange-400',
    3: 'bg-emerald-400',
    4: 'bg-emerald-500',
  };
  return { score: capped, label: labels[capped], color: colors[capped] };
}

/* ---------- Confirm Password ---------- */
export function validateConfirmPassword(
  password: string,
  confirm: string,
): ValidationResult {
  if (!confirm) return { valid: false, error: 'Please confirm your password' };
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' };
  return { valid: true };
}

/* ---------- Full Name ---------- */
export function validateFullName(name: string): ValidationResult {
  if (!name) return { valid: false, error: 'Full name is required' };
  const trimmed = name.trim();
  if (trimmed.length < 2) return { valid: false, error: 'Name is too short' };
  if (trimmed.length > 200) return { valid: false, error: 'Name is too long' };
  if (!/^[a-zA-Z\s'.-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  return { valid: true };
}
