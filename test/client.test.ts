import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "../src/api/client.js";

const profile = {
  name: "local",
  baseUrl: "http://localhost:5678",
  apiKey: "sk_test_123456",
};

test("createClient builds URLs and headers", async () => {
  let capturedUrl = "";
  let capturedHeaders: Record<string, string> = {};

  const originalFetch = global.fetch;
  global.fetch = (async (url: RequestInfo, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedHeaders = (init?.headers as Record<string, string>) ?? {};
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const client = createClient(profile);
    const result = await client.get("/executions", { limit: 5, includeData: true });
    assert.deepEqual(result, { ok: true });
    assert.equal(
      capturedUrl,
      "http://localhost:5678/api/v1/executions?limit=5&includeData=true"
    );
    assert.equal(capturedHeaders["X-N8N-API-KEY"], "sk_test_123456");
  } finally {
    global.fetch = originalFetch;
  }
});
