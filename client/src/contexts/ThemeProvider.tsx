import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './ThemeContext';

let storedTheme: Theme | null = null;
let systemPrefersDark = false;
if (typeof window !== 'undefined') {
  // Check if we're running in the browser.
  // ✅ Only runs once per app load
  storedTheme = localStorage.getItem('theme') as Theme | null;
  systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let initTheme: Theme = 'light';
if (storedTheme) {
  initTheme = storedTheme;
} else if (systemPrefersDark) {
  initTheme = 'dark';
} else {
  initTheme = 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(initTheme);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
