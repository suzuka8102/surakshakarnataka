// Smart API URL - works locally and on Railway
// In development: uses Vite proxy (/api → localhost:8080)
// In production on Railway: uses VITE_API_URL environment variable

const getApiBase = (): string => {
  // If VITE_API_URL is set (Railway production), use it directly
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL + '/api.php';
  }
  // Otherwise use Vite proxy (local development)
  return '/api';
};

export const API_BASE = getApiBase();

export async function apiFetch(action: string, params: Record<string, string> = {}) {
  try {
    const url = new URL(API_BASE, window.location.origin);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const j = await res.json();
    return j.success ? j.data : null;
  } catch { return null; }
}

export async function apiPost(action: string, body: Record<string, unknown>) {
  try {
    const url = `${API_BASE}?action=${action}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const j = await res.json();
    return j.success ? j.data : null;
  } catch { return null; }
}
