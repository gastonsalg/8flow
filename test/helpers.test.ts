import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseJsonInput, parseKeyValuePairs } from "../src/commands/helpers.js";

test("parseKeyValuePairs handles pairs", () => {
  const result = parseKeyValuePairs(["a=1", "b=two"]);
  assert.deepEqual(result, { a: "1", b: "two" });
});

test("parseKeyValuePairs rejects invalid input", () => {
  assert.throws(() => parseKeyValuePairs(["broken"]), /key=value/);
});

test("parseJsonInput accepts inline JSON", () => {
  const value = parseJsonInput("{\"ok\":true}");
  assert.deepEqual(value, { ok: true });
});

test("parseJsonInput accepts JSON file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "n8n-cli-"));
  const filePath = path.join(dir, "input.json");
  fs.writeFileSync(filePath, JSON.stringify({ file: true }));

  const value = parseJsonInput(undefined, filePath);
  assert.deepEqual(value, { file: true });
});

test("parseJsonInput rejects invalid JSON", () => {
  assert.throws(() => parseJsonInput("{bad}"), /Invalid JSON input/);
});
