import { useState, useEffect } from "react";

export interface StyleProfile {
  vibe: string;
  palette: string;
  occasion: string;
  budget: string;
  completedAt?: number;
}

const KEY = "mu_style_dna";

export function useStyleProfile() {
  const [profile, setProfile] = useState<StyleProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw) as StyleProfile);
    } catch { /* ignore */ }
  }, []);

  const save = (p: StyleProfile) => {
    const data = { ...p, completedAt: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
    setProfile(data);
  };

  const clear = () => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setProfile(null);
  };

  return { profile, save, clear };
}
