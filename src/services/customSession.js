const KEY = 'counselor_custom_token';
let token = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
export const getCustomToken = () => token;
export function setCustomToken(value, remember = true) {
 token = value || null;
 if (typeof localStorage !== 'undefined') { if (token && remember) localStorage.setItem(KEY, token); else localStorage.removeItem(KEY); }
}
export function clearCustomToken(){ token = null; if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY); }
export function decodeCustomToken(){ try { if(!token) return null; const p=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(atob(p)); } catch { return null; } }
