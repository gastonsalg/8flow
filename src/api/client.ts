import { Profile } from "../config/types.js";

export type ApiClient = {
  get: <T = unknown>(
    path: string,
    query?: Record<string, string | number | boolean>,
  ) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  patch: <T = unknown>(path: string, body?: unknown) => Promise<T>;
  delete: <T = unknown>(path: string) => Promise<T>;
  request: <T = unknown>(
    method: string,
    path: string,
    options?: RequestOptions,
  ) => Promise<T>;
};

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
};

export function normalizeInstanceUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed.slice(0, -"/api/v1".length) : trimmed;
}

function normalizeBaseUrl(baseUrl: string): string {
  const instanceUrl = normalizeInstanceUrl(baseUrl);
  return `${instanceUrl}/api/v1`;
}

function toQueryString(
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createClient(profile: Profile): ApiClient {
  const baseUrl = normalizeBaseUrl(profile.baseUrl);
  const headers = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": profile.apiKey,
    ...(profile.defaultHeaders ?? {}),
  };

  async function request<T>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    const query = toQueryString(options?.query);
    const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}${query}`;
    const init: RequestInit = {
      method,
      headers: { ...headers, ...(options?.headers ?? {}) },
    };
    if (options?.body !== undefined) init.body = JSON.stringify(options.body);
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const detail = body ? ` - ${body.slice(0, 200)}` : "";
      throw new Error(
        `Request failed ${res.status} ${res.statusText}${detail}`,
      );
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    request: <T>(method: string, path: string, options?: RequestOptions) =>
      request<T>(method.toUpperCase(), path, options),
    get: <T>(path: string, query?: Record<string, string | number | boolean>) =>
      request<T>("GET", path, { query }),
    post: <T>(path: string, body?: unknown) =>
      request<T>("POST", path, { body }),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>("PATCH", path, { body }),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
}
