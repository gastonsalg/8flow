import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, printResult } from "./helpers.js";
import { tagSchema, validateSchema } from "../validation/schemas.js";

export async function listTags(profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get("/tags");
  printResult(result);
}

export async function getTag(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/tags/${id}`);
  printResult(result);
}

export async function createTag(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Tag body is required. Use --data or --file.");
  const validated = validateSchema(tagSchema, body);
  const result = await client.post("/tags", validated);
  printResult(result);
}

export async function updateTag(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Tag body is required. Use --data or --file.");
  const validated = validateSchema(tagSchema, body);
  const result = await client.put(`/tags/${id}`, validated);
  printResult(result);
}

export async function deleteTag(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/tags/${id}`);
  printResult(result);
}
