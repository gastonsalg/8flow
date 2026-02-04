import fs from "node:fs";

export function parseKeyValuePairs(pairs?: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!pairs) return result;
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx <= 0) throw new Error(`Invalid pair '${pair}'. Use key=value.`);
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!key) throw new Error(`Invalid pair '${pair}'. Use key=value.`);
    result[key] = value;
  }
  return result;
}

export function parseJsonInput(data?: string, filePath?: string): unknown {
  if (data && filePath) throw new Error("Use either --data or --file, not both.");
  if (!data && !filePath) return undefined;
  const raw = data ?? fs.readFileSync(filePath!, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON input: ${detail}`);
  }
}

export function printResult(result: unknown, pretty = true): void {
  if (result === undefined) {
    console.log("OK");
    return;
  }
  const output = pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result);
  console.log(output);
}
