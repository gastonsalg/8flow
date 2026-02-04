import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, parseKeyValuePairs, printResult } from "./helpers.js";
import {
  validateSchema,
  workflowSchema,
  workflowTagsSchema,
} from "../validation/schemas.js";

export async function listWorkflows(
  queryPairs?: string[],
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = parseKeyValuePairs(queryPairs);
  const result = await client.get("/workflows", query);
  printResult(result);
}

export async function getWorkflow(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/workflows/${id}`);
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
