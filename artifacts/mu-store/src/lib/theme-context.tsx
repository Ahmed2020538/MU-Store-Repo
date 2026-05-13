import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme, animate = true) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transitioning");
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 320);
  }
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("mu_theme") as ThemeMode | null;
    return stored ?? "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme((localStorage.getItem("mu_theme") as ThemeMode) ?? "system")
  );

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem("mu_theme", next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyTheme(resolved, true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  // Listen to system preference changes when in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const resolved: ResolvedTheme = e.matches ? "dark" : "light";
        setResolvedTheme(resolved);
        applyTheme(resolved, true);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "mu_theme" && e.newValue) {
        const next = e.newValue as ThemeMode;
        setThemeState(next);
        const resolved = resolveTheme(next);
        setResolvedTheme(resolved);
        applyTheme(resolved, true);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Apply correct theme on mount (without animation — FOUC script already ran)
  useEffect(() => {
    applyTheme(resolvedTheme, false);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
