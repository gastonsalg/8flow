import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseKeyValuePairs, printResult } from "./helpers.js";

export async function listExecutions(
  queryPairs?: string[],
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = parseKeyValuePairs(queryPairs);
  const result = await client.get("/executions", query);
  printResult(result);
}

export async function getExecution(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/executions/${id}`);
  printResult(result);
}

export async function deleteExecution(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/executions/${id}`);
  printResult(result);
}

export async function retryExecution(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.post(`/executions/${id}/retry`);
  printResult(result);
}
