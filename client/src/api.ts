const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(base + path, { ...options, credentials: 'include',
      signal: options.signal || controller.signal,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({ message: 'The server returned an unexpected response.' }));
    if (!response.ok) throw new ApiError(data.message || 'Unable to complete this request.', response.status, data.fields);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The request timed out. Please try again.');
    throw new Error('Cannot reach the server. Check your connection and try again.');
  } finally { clearTimeout(timer); }
}
export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
