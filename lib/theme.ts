// lib/theme.ts
// Theme selection, resolution, and persistence (DG 4.1). The user picks one of
// three modes. "system" clears the manual override and follows the OS setting,
// including live changes. The resolved theme is written to data-theme on <html>.
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme-preference";

export function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

// Write the resolved theme to the document root. Called by the toggle and by
// the pre-paint inline script (see ThemeScript) to avoid a flash of wrong theme.
export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveMode(mode);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

export function setStoredMode(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}
