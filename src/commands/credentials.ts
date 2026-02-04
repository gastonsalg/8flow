import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, printResult } from "./helpers.js";
import {
  credentialSchema,
  credentialUpdateSchema,
  validateSchema,
} from "../validation/schemas.js";

export async function createCredential(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body)
    throw new Error("Credential body is required. Use --data or --file.");
  const validated = validateSchema(credentialSchema, body);
  const result = await client.post("/credentials", validated);
  printResult(result);
}

export async function updateCredential(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body)
    throw new Error("Credential body is required. Use --data or --file.");
  const validated = validateSchema(credentialUpdateSchema, body);
  const result = await client.patch(`/credentials/${id}`, validated);
  printResult(result);
}

export async function deleteCredential(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/credentials/${id}`);
  printResult(result);
}

export async function getCredentialSchema(
  typeName: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/credentials/schema/${typeName}`);
  printResult(result);
}
