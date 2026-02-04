import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, printResult } from "./helpers.js";
import { validateSchema, variableSchema, variableUpdateSchema } from "../validation/schemas.js";

export async function listVariables(profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get("/variables");
  printResult(result);
}

export async function createVariable(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Variable body is required. Use --data or --file.");
  const validated = validateSchema(variableSchema, body);
  const result = await client.post("/variables", validated);
  printResult(result);
}

export async function updateVariable(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Variable body is required. Use --data or --file.");
  const validated = validateSchema(variableUpdateSchema, body);
  const result = await client.put(`/variables/${id}`, validated);
  printResult(result);
}

export async function deleteVariable(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/variables/${id}`);
  printResult(result);
}
