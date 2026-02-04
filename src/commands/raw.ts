import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, parseKeyValuePairs, printResult } from "./helpers.js";

export async function rawRequest(
  method: string,
  path: string,
  options: {
    data?: string;
    file?: string;
    query?: string[];
    header?: string[];
    pretty?: boolean;
    profile?: string;
  }
): Promise<void> {
  const profile = getProfile(options.profile);
  const client = createClient(profile);
  const query = parseKeyValuePairs(options.query);
  const headers = parseKeyValuePairs(options.header);
  const body = parseJsonInput(options.data, options.file);

  const result = await client.request(method, path, {
    query,
    headers,
    body,
  });

  printResult(result, options.pretty ?? true);
}
