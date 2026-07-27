"use client";
// components/shell/ThemeToggle.tsx
// A three-way segmented control: light / dark / system (DG 4.1, 9.8). Mono
// labels, pill container, the active segment slides with springUI. Persists the
// choice and, in system mode, follows live OS changes. The active-indicator
// spring is disabled under reduced motion.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  applyTheme,
  getStoredMode,
  setStoredMode,
  type ThemeMode,
} from "@/lib/theme";
import { springUI } from "@/lib/motion";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMode(getStoredMode());
    setMounted(true);
  }, []);

  // Follow live OS changes while in system mode.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  function choose(next: ThemeMode) {
    setMode(next);
    setStoredMode(next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-panel p-1"
    >
      {MODES.map((m) => {
        const active = mounted && mode === m.value;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            onClick={() => choose(m.value)}
            className="relative rounded-pill px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.1em] transition-colors"
            style={{
              color: active
                ? "var(--color-text-serif)"
                : "var(--color-text-muted)",
            }}
          >
            {active && (
              <motion.span
                layoutId="theme-active"
                className="absolute inset-0 rounded-pill"
                style={{ background: "var(--color-accent-soft)" }}
                transition={reduced ? { duration: 0 } : springUI}
              />
            )}
            <span className="relative z-10">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
