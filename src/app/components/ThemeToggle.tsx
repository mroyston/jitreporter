"use client";

import { useEffect, useState } from "react";

function getSystemMode(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  // null = no explicit override (follow system). "light" | "dark" = user override.
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const [effective, setEffective] = useState<"light" | "dark">("light");

  // On mount, read saved preference
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setOverride(stored);
      setEffective(stored);
    } else {
      setOverride(null);
      setEffective(getSystemMode());
    }
  }, []);

  // Apply the dark class whenever effective mode changes
  useEffect(() => {
    const root = document.documentElement;
    if (effective === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [effective]);

  // Listen for OS preference changes when no user override is set
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      if (override === null) {
        setEffective(mq.matches ? "dark" : "light");
      }
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [override]);

  function toggle() {
    const next = effective === "light" ? "dark" : "light";
    setOverride(next);
    setEffective(next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="hover:text-blue-300 transition-colors p-1"
      title={`Theme: ${effective === "light" ? "Light" : "Dark"}. Click to switch.`}
      aria-label={`Current theme: ${effective === "light" ? "Light" : "Dark"}. Click to switch.`}
    >
      {effective === "light" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
