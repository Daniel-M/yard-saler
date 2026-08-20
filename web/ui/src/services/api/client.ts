export interface ApiClientOptions extends RequestInit {
  token?: string;
  baseUrl?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const apiBaseUrl = options.baseUrl || import.meta.env.VITE_API_URL || "";
  const token = options.token || localStorage.getItem("token");

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMessage);
  }

  if (
    response.status === 204 ||
    (response.headers && response.headers.get("content-length") === "0")
  ) {
    return null as unknown as T;
  }

  try {
    return await response.json();
  } catch {
    return null as unknown as T;
  }
}
