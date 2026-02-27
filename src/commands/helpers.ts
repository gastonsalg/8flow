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

function parseFieldPaths(fields?: string[]): string[] {
  if (!fields) return [];
  return fields
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function getByPath(record: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = record;
  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setByPath(record: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current = record;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const next = current[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function pickFields(value: unknown, fields: string[]): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const field of fields) {
    const selected = getByPath(input, field);
    if (selected !== undefined) setByPath(output, field, selected);
  }
  return output;
}

function transformForFields(result: unknown, fields: string[]): unknown {
  if (fields.length === 0) return result;
  if (Array.isArray(result)) return result.map((item) => pickFields(item, fields));

  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    const data = record.data;
    if (Array.isArray(data)) {
      return {
        ...record,
        data: data.map((item) => pickFields(item, fields)),
      };
    }
  }

  return pickFields(result, fields);
}

function extractRowsForJsonl(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && Array.isArray((result as Record<string, unknown>).data)) {
    return (result as Record<string, unknown>).data as unknown[];
  }
  return [result];
}

export function printResult(
  result: unknown,
  pretty = true,
  options?: { fields?: string[]; jsonl?: boolean },
): void {
  if (result === undefined) {
    console.log("OK");
    return;
  }

  const fields = parseFieldPaths(options?.fields);
  const transformed = transformForFields(result, fields);

  if (options?.jsonl) {
    const rows = extractRowsForJsonl(transformed);
    for (const row of rows) {
      console.log(JSON.stringify(row));
    }
    return;
  }

  const output = pretty ? JSON.stringify(transformed, null, 2) : JSON.stringify(transformed);
  console.log(output);
}
