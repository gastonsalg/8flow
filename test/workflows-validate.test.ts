import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { saveConfig } from "../src/config/store.js";
import { validateWorkflow } from "../src/commands/workflows.js";

const baseProfile = {
  name: "local",
  baseUrl: "http://example.test",
  apiKey: "sk_local",
};

type MockRequest = {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
};

type MockResponse = {
  status?: number;
  json?: unknown;
  body?: string;
  headers?: Record<string, string>;
};

function setupTempConfig(): void {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "8flow-validate-"));
  process.env.XDG_CONFIG_HOME = tmpRoot;
  saveConfig({ profiles: [baseProfile], activeProfile: "local" });
}

function withCapturedLogs(fn: () => Promise<void>): Promise<string[]> {
  const original = console.log;
  const logs: string[] = [];
  console.log = (message?: unknown) => {
    logs.push(String(message ?? ""));
  };
  return fn()
    .then(() => logs)
    .finally(() => {
      console.log = original;
    });
}

function mockFetch(handler: (req: MockRequest) => MockResponse | Promise<MockResponse>): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers ?? {});
    const body = typeof init?.body === "string" ? init.body : undefined;
    const response = await handler({ url, method, headers, body });

    if (response.status === 204) return new Response(null, { status: 204, headers: response.headers });
    if (response.json !== undefined) {
      return new Response(JSON.stringify(response.json), {
        status: response.status ?? 200,
        headers: { "Content-Type": "application/json", ...(response.headers ?? {}) },
      });
    }
    return new Response(response.body ?? "", { status: response.status ?? 200, headers: response.headers });
  };
  return () => {
    globalThis.fetch = original;
  };
}

test("validateWorkflow succeeds for valid local payload", async () => {
  const payload = {
    name: "Demo",
    nodes: [{ name: "Start", type: "n8n-nodes-base.manualTrigger", parameters: {} }],
    connections: {},
    settings: {},
  };

  const logs = await withCapturedLogs(async () => {
    await validateWorkflow({ data: JSON.stringify(payload) });
  });

  assert.equal(logs.length, 1);
  const result = JSON.parse(logs[0]) as { ok: boolean; source: string; serverChecks: boolean };
  assert.equal(result.ok, true);
  assert.equal(result.source, "inline");
  assert.equal(result.serverChecks, false);
});

test("validateWorkflow fails when connection points to missing node", async () => {
  const payload = {
    name: "Demo",
    nodes: [{ name: "Start", type: "n8n-nodes-base.manualTrigger", parameters: {} }],
    connections: {
      Start: {
        main: [[{ node: "MissingNode", type: "main", index: 0 }]],
      },
    },
    settings: {},
  };

  await assert.rejects(
    withCapturedLogs(async () => {
      await validateWorkflow({ data: JSON.stringify(payload) });
    }),
    /validation failed/i,
  );
});

test("validateWorkflow with --server checks credential schema availability", async () => {
  setupTempConfig();
  const payload = {
    name: "Demo",
    nodes: [
      {
        name: "Slack",
        type: "n8n-nodes-base.slack",
        parameters: {},
        credentials: { slackOAuth2Api: { id: "cred-1" } },
      },
    ],
    connections: {},
    settings: {},
  };

  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/credentials/schema/slackOAuth2Api");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { type: "object", properties: {} } };
  });

  try {
    const logs = await withCapturedLogs(async () => {
      await validateWorkflow({ data: JSON.stringify(payload), server: true, profile: "local" });
    });
    const result = JSON.parse(logs[0]) as { ok: boolean; serverChecks: boolean; warnings: unknown[] };
    assert.equal(result.ok, true);
    assert.equal(result.serverChecks, true);
    assert.ok(Array.isArray(result.warnings));
  } finally {
    restore();
  }
});

test("validateWorkflow --id fetches workflow then runs server checks", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    if (req.url === "http://example.test/api/v1/workflows/42") {
      return {
        json: {
          name: "Remote",
          nodes: [
            {
              name: "GitHub",
              type: "n8n-nodes-base.github",
              parameters: {},
              credentials: { githubApi: { id: "1" } },
            },
          ],
          connections: {},
          settings: {},
        },
      };
    }
    assert.equal(req.url, "http://example.test/api/v1/credentials/schema/githubApi");
    return { json: { type: "object", properties: {} } };
  });

  try {
    const logs = await withCapturedLogs(async () => {
      await validateWorkflow({ id: "42", server: true, profile: "local" });
    });
    const result = JSON.parse(logs[0]) as { ok: boolean; source: string };
    assert.equal(result.ok, true);
    assert.equal(result.source, "remote");
  } finally {
    restore();
  }
});

