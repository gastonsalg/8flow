import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, parseKeyValuePairs, printResult } from "./helpers.js";
import {
  validateSchema,
  workflowSchema,
  workflowTagsSchema,
} from "../validation/schemas.js";

type WorkflowNode = {
  name?: unknown;
  type?: unknown;
  credentials?: unknown;
  parameters?: unknown;
};

type WorkflowConnection = {
  node?: unknown;
  type?: unknown;
  index?: unknown;
};

type WorkflowPayload = {
  name: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
};

type ValidateIssue = {
  code: string;
  message: string;
  path?: string;
};

type ValidateSummary = {
  nodes: number;
  connections: number;
  credentialRefs: number;
};

type ValidateResult = {
  ok: boolean;
  source: "file" | "inline" | "remote";
  serverChecks: boolean;
  errors: ValidateIssue[];
  warnings: ValidateIssue[];
  summary: ValidateSummary;
};

type ValidateWorkflowOptions = {
  id?: string;
  data?: string;
  file?: string;
  server?: boolean;
  profile?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectExpressionIssues(
  value: unknown,
  path: string,
  warnings: ValidateIssue[],
): void {
  if (typeof value === "string") {
    if (value.includes("{{") || value.includes("}}")) {
      const openCount = (value.match(/\{\{/g) ?? []).length;
      const closeCount = (value.match(/\}\}/g) ?? []).length;
      if (openCount !== closeCount) {
        warnings.push({
          code: "expression.unbalanced-braces",
          path,
          message: "Expression appears to have unbalanced '{{' and '}}' tokens.",
        });
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      collectExpressionIssues(value[i], `${path}[${i}]`, warnings);
    }
    return;
  }

  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    collectExpressionIssues(nested, `${path}.${key}`, warnings);
  }
}

function validateConnectionTarget(
  connection: unknown,
  sourcePath: string,
  nodeNames: Set<string>,
  errors: ValidateIssue[],
): boolean {
  if (!isRecord(connection)) {
    errors.push({
      code: "connections.invalid-edge",
      path: sourcePath,
      message: "Connection edge must be an object.",
    });
    return false;
  }

  const edge = connection as WorkflowConnection;
  if (typeof edge.node !== "string" || edge.node.trim().length === 0) {
    errors.push({
      code: "connections.invalid-target",
      path: sourcePath,
      message: "Connection edge is missing target node name.",
    });
    return false;
  }

  if (!nodeNames.has(edge.node)) {
    errors.push({
      code: "connections.missing-target-node",
      path: sourcePath,
      message: `Connection references unknown target node '${edge.node}'.`,
    });
    return false;
  }

  return true;
}

function runLocalWorkflowChecks(payload: WorkflowPayload): {
  errors: ValidateIssue[];
  warnings: ValidateIssue[];
  summary: ValidateSummary;
  credentialTypes: Set<string>;
} {
  const errors: ValidateIssue[] = [];
  const warnings: ValidateIssue[] = [];
  const summary: ValidateSummary = {
    nodes: payload.nodes.length,
    connections: 0,
    credentialRefs: 0,
  };
  const nodeNames = new Set<string>();
  const credentialTypes = new Set<string>();

  payload.nodes.forEach((node, index) => {
    if (!isRecord(node)) {
      errors.push({
        code: "nodes.invalid-shape",
        path: `nodes[${index}]`,
        message: "Node must be an object.",
      });
      return;
    }

    if (typeof node.name !== "string" || node.name.trim().length === 0) {
      errors.push({
        code: "nodes.missing-name",
        path: `nodes[${index}].name`,
        message: "Node is missing a valid name.",
      });
    } else if (nodeNames.has(node.name)) {
      errors.push({
        code: "nodes.duplicate-name",
        path: `nodes[${index}].name`,
        message: `Duplicate node name '${node.name}'.`,
      });
    } else {
      nodeNames.add(node.name);
    }

    if (typeof node.type !== "string" || node.type.trim().length === 0) {
      errors.push({
        code: "nodes.missing-type",
        path: `nodes[${index}].type`,
        message: "Node is missing a valid type.",
      });
    }

    if (node.parameters !== undefined) {
      collectExpressionIssues(node.parameters, `nodes[${index}].parameters`, warnings);
    }

    if (node.credentials === undefined) return;
    if (!isRecord(node.credentials)) {
      warnings.push({
        code: "credentials.invalid-node-credentials",
        path: `nodes[${index}].credentials`,
        message: "Node credentials should be an object.",
      });
      return;
    }

    for (const [credentialType, ref] of Object.entries(node.credentials)) {
      credentialTypes.add(credentialType);
      summary.credentialRefs += 1;
      if (!isRecord(ref)) {
        warnings.push({
          code: "credentials.invalid-reference",
          path: `nodes[${index}].credentials.${credentialType}`,
          message: `Credential reference for '${credentialType}' should be an object with id or name.`,
        });
        continue;
      }
      const id = ref.id;
      const name = ref.name;
      const hasId = typeof id === "string" && id.trim().length > 0;
      const hasName = typeof name === "string" && name.trim().length > 0;
      if (!hasId && !hasName) {
        warnings.push({
          code: "credentials.missing-reference-id-name",
          path: `nodes[${index}].credentials.${credentialType}`,
          message: `Credential reference for '${credentialType}' is missing both id and name.`,
        });
      }
    }
  });

  for (const [sourceName, channels] of Object.entries(payload.connections)) {
    if (!nodeNames.has(sourceName)) {
      errors.push({
        code: "connections.missing-source-node",
        path: `connections.${sourceName}`,
        message: `Connections include unknown source node '${sourceName}'.`,
      });
    }

    if (!isRecord(channels)) {
      errors.push({
        code: "connections.invalid-source",
        path: `connections.${sourceName}`,
        message: "Connection source entry must be an object.",
      });
      continue;
    }

    for (const [channelName, outputs] of Object.entries(channels)) {
      if (!Array.isArray(outputs)) {
        warnings.push({
          code: "connections.invalid-channel",
          path: `connections.${sourceName}.${channelName}`,
          message: "Connection channel should be an array of output groups.",
        });
        continue;
      }

      outputs.forEach((outputGroup, outputIndex) => {
        if (!Array.isArray(outputGroup)) {
          warnings.push({
            code: "connections.invalid-output-group",
            path: `connections.${sourceName}.${channelName}[${outputIndex}]`,
            message: "Connection output group should be an array.",
          });
          return;
        }

        outputGroup.forEach((edge, edgeIndex) => {
          const edgePath = `connections.${sourceName}.${channelName}[${outputIndex}][${edgeIndex}]`;
          if (validateConnectionTarget(edge, edgePath, nodeNames, errors)) {
            summary.connections += 1;
          }
        });
      });
    }
  }

  return { errors, warnings, summary, credentialTypes };
}

async function runServerWorkflowChecks(
  credentialTypes: Set<string>,
  profileName?: string,
): Promise<{ errors: ValidateIssue[]; warnings: ValidateIssue[] }> {
  const errors: ValidateIssue[] = [];
  const warnings: ValidateIssue[] = [];
  const profile = getProfile(profileName);
  const client = createClient(profile);

  for (const credentialType of credentialTypes) {
    const encoded = encodeURIComponent(credentialType);
    try {
      await client.get(`/credentials/schema/${encoded}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      if (detail.includes("404")) {
        errors.push({
          code: "server.unsupported-credential-type",
          path: `credentials.${credentialType}`,
          message: `Credential type '${credentialType}' is not available on this server.`,
        });
        continue;
      }
      errors.push({
        code: "server.check-failed",
        path: `credentials.${credentialType}`,
        message: `Server-backed validation failed while checking credential type '${credentialType}': ${detail}`,
      });
    }
  }

  if (credentialTypes.size === 0) {
    try {
      await client.get("/workflows", { limit: 1 });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      errors.push({
        code: "server.check-failed",
        message: `Server-backed validation failed while performing connectivity check: ${detail}`,
      });
    }
  }

  if (credentialTypes.size > 0) {
    warnings.push({
      code: "server.credential-existence-not-verifiable",
      message: "Credential reference existence (id/name) cannot be fully verified with the current public API surface.",
    });
  }

  return { errors, warnings };
}

function resolveWorkflowSource(options: ValidateWorkflowOptions): "file" | "inline" | "remote" {
  if (options.id) return "remote";
  if (options.file) return "file";
  return "inline";
}

export async function validateWorkflow(options: ValidateWorkflowOptions): Promise<void> {
  const { id, data, file, server, profile } = options;

  if (id && (data || file)) {
    throw new Error("Use either --id or --data/--file, not both.");
  }
  if (!id && !data && !file) {
    throw new Error("Workflow input is required. Use --id or --data/--file.");
  }

  let payload: WorkflowPayload;
  if (id) {
    const client = createClient(getProfile(profile));
    const result = await client.get(`/workflows/${id}`);
    payload = validateSchema(workflowSchema, result) as WorkflowPayload;
  } else {
    const body = parseJsonInput(data, file);
    payload = validateSchema(workflowSchema, body) as WorkflowPayload;
  }

  const local = runLocalWorkflowChecks(payload);
  const result: ValidateResult = {
    ok: local.errors.length === 0,
    source: resolveWorkflowSource(options),
    serverChecks: Boolean(server),
    errors: [...local.errors],
    warnings: [...local.warnings],
    summary: local.summary,
  };

  if (server) {
    const serverResult = await runServerWorkflowChecks(local.credentialTypes, profile);
    result.errors.push(...serverResult.errors);
    result.warnings.push(...serverResult.warnings);
    result.ok = result.errors.length === 0;
  }

  printResult(result);
  if (!result.ok) {
    throw new Error(`Workflow validation failed with ${result.errors.length} error(s).`);
  }
}

export async function listWorkflows(
  queryPairs?: string[],
  profileName?: string,
  fields?: string[],
  jsonl?: boolean,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = parseKeyValuePairs(queryPairs);
  const result = await client.get("/workflows", query);
  printResult(result, true, { fields, jsonl });
}

export async function getWorkflow(
  id: string,
  excludePinnedData?: boolean,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = excludePinnedData ? { excludePinnedData: true } : undefined;
  const result = await client.get(`/workflows/${id}`, query);
  printResult(result);
}

export async function createWorkflow(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body)
    throw new Error("Workflow body is required. Use --data or --file.");
  const validated = validateSchema(workflowSchema, body);
  const result = await client.post("/workflows", validated);
  printResult(result);
}

export async function updateWorkflow(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body)
    throw new Error("Workflow body is required. Use --data or --file.");
  const validated = validateSchema(workflowSchema, body);
  const result = await client.put(`/workflows/${id}`, validated);
  printResult(result);
}

export async function deleteWorkflow(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/workflows/${id}`);
  printResult(result);
}

export async function activateWorkflow(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.post(`/workflows/${id}/activate`);
  printResult(result);
}

export async function deactivateWorkflow(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.post(`/workflows/${id}/deactivate`);
  printResult(result);
}

export async function getWorkflowTags(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/workflows/${id}/tags`);
  printResult(result);
}

export async function setWorkflowTags(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Tags body is required. Use --data or --file.");
  const validated = validateSchema(workflowTagsSchema, body);
  const result = await client.put(`/workflows/${id}/tags`, validated);
  printResult(result);
}
