// Tracker state: which trophies are earned, saved in localStorage, exportable and importable.
export const STORAGE_KEY = 'leonida-ledger-earned-v1';

// Load the earned set from the browser. A corrupt value falls back to empty, never crashes the page.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

// Persist the earned set. Returns true when the write worked.
export function saveEarned(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
    return true;
  } catch {
    return false;
  }
}

// Serialise the earned set for the export file.
export function exportText(earned) {
  return JSON.stringify({ app: 'leonida-ledger', version: 1, earned: [...earned].sort() }, null, 2);
}

// Parse an imported file back into an earned set. Accepts our export shape or a plain array of names.
export function parseImport(text, knownNames) {
  const data = JSON.parse(text);
  const names = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(names)) throw new Error('no earned list found');
  const known = new Set(knownNames);
  const kept = names.filter((n) => typeof n === 'string' && known.has(n));
  return new Set(kept);
}
