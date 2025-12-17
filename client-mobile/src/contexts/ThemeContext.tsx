import React, { createContext, useContext, useEffect, useState } from "react";
import { useUserSettings } from "@/lib/firebaseHooks";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const { settings, updateSettings } = useUserSettings();
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      // Try Firebase first, then localStorage as fallback
      const firebaseTheme = settings?.theme;
      if (firebaseTheme && (firebaseTheme === "light" || firebaseTheme === "dark")) {
        return firebaseTheme;
      }
      const stored = localStorage.getItem("theme");
      if (stored && (stored === "light" || stored === "dark")) {
        return stored as Theme;
      }
      // Migrate from localStorage to Firebase if available
      if (stored && updateSettings) {
        updateSettings({ theme: stored as Theme }).catch(console.error);
        localStorage.removeItem("theme");
      }
      return defaultTheme;
    }
    return defaultTheme;
  });

  // Sync with Firebase UserSettings when settings change
  useEffect(() => {
    if (switchable && settings?.theme && (settings.theme === "light" || settings.theme === "dark")) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable && updateSettings) {
      // Save to Firebase UserSettings
      updateSettings({ theme }).catch(console.error);
      // Keep localStorage as fallback for now
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable, updateSettings]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
