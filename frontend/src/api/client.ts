const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Obsługa błędów w sposób czytelny
  if (!resp.ok) {
    let detail: any = null;
    try {
      detail = await resp.json();
    } catch {
      // nic
    }
    const msg =
      detail?.detail ??
      detail?.message ??
      `HTTP ${resp.status} ${resp.statusText}`;
    throw new Error(msg);
  }

  return resp.json() as Promise<T>;
}
