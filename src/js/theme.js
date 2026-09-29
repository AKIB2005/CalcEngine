/**
 * CalcEngine — Theme Manager
 * Handles dark/light mode with localStorage persistence
 */

const THEME_KEY = 'calcengine-theme';

let currentTheme = 'dark';

/**
 * Initialize theme from localStorage or system preference
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    currentTheme = saved;
  } else {
    // Respect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }
  applyTheme();
}

/**
 * Toggle between dark and light themes
 */
export function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, currentTheme);
  applyTheme();
}

/**
 * Get the current theme
 */
export function getTheme() {
  return currentTheme;
}

/**
 * Apply theme to the document
 */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
}
