import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { authTest } from "../src/commands/auth.js";
import { getWorkflow, listWorkflows } from "../src/commands/workflows.js";
import { createVariable } from "../src/commands/variables.js";
import { debugExecution, getExecution, listExecutions } from "../src/commands/executions.js";
import { createProject } from "../src/commands/projects.js";
import { rawRequest } from "../src/commands/raw.js";
import { saveConfig } from "../src/config/store.js";

const baseProfile = {
  name: "local",
  baseUrl: "http://example.test",
  apiKey: "sk_local",
};

const altProfile = {
  name: "alt",
  baseUrl: "http://alt.test",
  apiKey: "sk_alt",
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
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "8flow-mock-"));
  process.env.XDG_CONFIG_HOME = tmpRoot;
  saveConfig({ profiles: [baseProfile, altProfile], activeProfile: "local" });
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
        headers: {
          "Content-Type": "application/json",
          ...(response.headers ?? {}),
        },
      });
    }

    return new Response(response.body ?? "", {
      status: response.status ?? 200,
      headers: response.headers,
    });
  };

  return () => {
    globalThis.fetch = original;
  };
}

test("authTest uses profile override and sets API key header", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://alt.test/api/v1/workflows");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_alt");
    return { json: [] };
  });

  try {
    await authTest("alt");
  } finally {
    restore();
  }
});

test("listWorkflows passes query parameters", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/workflows?limit=5&active=true");
    return { json: { data: [] } };
  });

  try {
    await listWorkflows(["limit=5", "active=true"], "local");
  } finally {
    restore();
  }
});

test("getWorkflow excludePinnedData adds excludePinnedData query parameter", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/workflows/88?excludePinnedData=true");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { id: "88" } };
  });

  try {
    await getWorkflow("88", true, "local");
  } finally {
    restore();
  }
});

test("createVariable sends JSON body", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "POST");
    assert.equal(req.url, "http://example.test/api/v1/variables");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    assert.equal(req.body, JSON.stringify({ key: "API_HOST", value: "https://example" }));
    return { json: { id: "1" } };
  });

  try {
    await createVariable(JSON.stringify({ key: "API_HOST", value: "https://example" }), undefined, "local");
  } finally {
    restore();
  }
});

test("rawRequest forwards headers, query, and body", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "POST");
    assert.equal(req.url, "http://example.test/api/v1/tags?limit=1");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    assert.equal(req.headers.get("X-Test"), "1");
    assert.equal(req.body, JSON.stringify({ name: "Ops" }));
    return { json: { id: "10" } };
  });

  try {
    await rawRequest("POST", "/tags", {
      data: "{\"name\":\"Ops\"}",
      header: ["X-Test=1"],
      query: ["limit=1"],
      pretty: false,
      profile: "local",
    });
  } finally {
    restore();
  }
});

test("listExecutions passes query parameters", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/executions?limit=2&status=success");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { data: [] } };
  });

  try {
    await listExecutions(["limit=2", "status=success"], "local");
  } finally {
    restore();
  }
});

test("listExecutions includeData adds includeData query parameter", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/executions?limit=2&includeData=true");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { data: [] } };
  });

  try {
    await listExecutions(["limit=2"], "local", true);
  } finally {
    restore();
  }
});

test("getExecution includeData adds includeData query parameter", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/executions/42?includeData=true");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { id: "42" } };
  });

  try {
    await getExecution("42", true, "local");
  } finally {
    restore();
  }
});

test("debugExecution uses includeData query parameter", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "http://example.test/api/v1/executions/99?includeData=true");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    return { json: { id: "99" } };
  });

  try {
    await debugExecution("99", "local");
  } finally {
    restore();
  }
});

test("createProject sends JSON body", async () => {
  setupTempConfig();
  const restore = mockFetch((req) => {
    assert.equal(req.method, "POST");
    assert.equal(req.url, "http://example.test/api/v1/projects");
    assert.equal(req.headers.get("X-N8N-API-KEY"), "sk_local");
    assert.equal(req.body, JSON.stringify({ name: "Platform" }));
    return { json: { id: "proj_1" } };
  });

  try {
    await createProject(JSON.stringify({ name: "Platform" }), undefined, "local");
  } finally {
    restore();
  }
});
