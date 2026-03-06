import { normalizeInstanceUrl } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, parseKeyValuePairs, printResult } from "./helpers.js";

function looksLikeExplicitWebhookPath(target: string): boolean {
  return target.startsWith("/webhook/") || target.startsWith("/webhook-test/");
}

function resolveWebhookUrl(target: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(target)) return target;
  const instanceUrl = normalizeInstanceUrl(baseUrl);
  const normalizedTarget = looksLikeExplicitWebhookPath(target)
    ? target
    : target.startsWith("/")
      ? target
      : `/webhook/${target}`;
  return `${instanceUrl}${normalizedTarget}`;
}

async function parseWebhookResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const raw = await response.text();
  if (raw.trim().length === 0) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(raw) as unknown;
  }

  return raw;
}

export async function triggerWebhook(
  target: string,
  options: {
    method?: string;
    data?: string;
    file?: string;
    dataFile?: string;
    query?: string[];
    header?: string[];
    pretty?: boolean;
    profile?: string;
    wait?: boolean;
    follow?: boolean;
  },
): Promise<void> {
  if (options.wait || options.follow) {
    throw new Error(
      "Webhook trigger polling is not implemented yet. The current command returns the webhook HTTP response only.",
    );
  }

  const profile = getProfile(options.profile);
  const url = new URL(resolveWebhookUrl(target, profile.baseUrl));
  const query = parseKeyValuePairs(options.query);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.append(key, value);
  }

  const headers = parseKeyValuePairs(options.header);
  const filePath = options.dataFile ?? options.file;
  const body = parseJsonInput(options.data, filePath);
  const initHeaders: Record<string, string> = {
    ...profile.defaultHeaders,
    ...headers,
  };

  if (body !== undefined && !Object.keys(initHeaders).some((key) => key.toLowerCase() === "content-type")) {
    initHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: (options.method ?? "POST").toUpperCase(),
    headers: initHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const suffix = detail ? ` - ${detail.slice(0, 200)}` : "";
    throw new Error(`Request failed ${response.status} ${response.statusText}${suffix}`);
  }

  const result = await parseWebhookResponse(response);
  printResult(result, options.pretty);
}
