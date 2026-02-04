import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, printResult } from "./helpers.js";
import { projectSchema, validateSchema } from "../validation/schemas.js";

export async function listProjects(profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get("/projects");
  printResult(result);
}

export async function createProject(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Project body is required. Use --data or --file.");
  const validated = validateSchema(projectSchema, body);
  const result = await client.post("/projects", validated);
  printResult(result);
}

export async function updateProject(
  projectId: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Project body is required. Use --data or --file.");
  const validated = validateSchema(projectSchema, body);
  const result = await client.put(`/projects/${projectId}`, validated);
  printResult(result);
}

export async function deleteProject(projectId: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/projects/${projectId}`);
  printResult(result);
}

export async function addProjectUser(
  projectId: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("User body is required. Use --data or --file.");
  const result = await client.post(`/projects/${projectId}/users`, body);
  printResult(result);
}

export async function updateProjectUser(
  projectId: string,
  userId: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("User body is required. Use --data or --file.");
  const result = await client.patch(`/projects/${projectId}/users/${userId}`, body);
  printResult(result);
}

export async function removeProjectUser(
  projectId: string,
  userId: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/projects/${projectId}/users/${userId}`);
  printResult(result);
}
