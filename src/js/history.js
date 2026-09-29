/**
 * CalcEngine — History Manager
 * Manages calculation history with localStorage persistence
 */

const HISTORY_KEY = 'calcengine-history';
const MAX_HISTORY = 100;

let history = [];
let onChangeCallback = null;

/**
 * Initialize history from localStorage
 */
export function initHistory(onChange) {
  onChangeCallback = onChange;
  const saved = localStorage.getItem(HISTORY_KEY);
  if (saved) {
    try {
      history = JSON.parse(saved);
    } catch {
      history = [];
    }
  }
  notifyChange();
}

/**
 * Add a calculation to history
 */
export function addToHistory(expression, result) {
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    expression,
    result,
    timestamp: Date.now(),
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  save();
  notifyChange();
  return entry;
}

/**
 * Delete a single history entry
 */
export function deleteEntry(id) {
  history = history.filter(entry => entry.id !== id);
  save();
  notifyChange();
}

/**
 * Clear all history
 */
export function clearHistory() {
  history = [];
  save();
  notifyChange();
}

/**
 * Get all history entries
 */
export function getHistory() {
  return [...history];
}

/**
 * Save to localStorage
 */
function save() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full; remove oldest entries
    if (history.length > 20) {
      history = history.slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }
}

function notifyChange() {
  if (onChangeCallback) {
    onChangeCallback(history);
  }
}
