const STORAGE_KEY = 'rmu_password_reset_gate';
const TTL_MS = 15 * 60 * 1000;

export type ForgotPasswordGate = {
  email: string;
  exp: number;
};

export function setForgotPasswordGate(email: string): void {
  if (typeof window === 'undefined') return;
  const normalized = email.trim().toLowerCase();
  const payload: ForgotPasswordGate = {
    email: normalized,
    exp: Date.now() + TTL_MS,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** Valid gate only; removes expired entries. */
export function readForgotPasswordGate(): ForgotPasswordGate | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ForgotPasswordGate;
    if (!parsed.email || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearForgotPasswordGate(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
