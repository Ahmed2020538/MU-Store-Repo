export type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const KEY = "mu_cookie_consent";

export function getConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setConsent(prefs: Omit<ConsentPreferences, "timestamp">): void {
  localStorage.setItem(KEY, JSON.stringify({ ...prefs, timestamp: new Date().toISOString() }));
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function revokeConsent(): void {
  localStorage.removeItem(KEY);
}
