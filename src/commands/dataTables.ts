import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, parseKeyValuePairs, printResult } from "./helpers.js";
import {
  dataTableCreateSchema,
  dataTableInsertRowsSchema,
  dataTableUpdateRowsSchema,
  dataTableUpdateSchema,
  dataTableUpsertRowsSchema,
  validateSchema,
} from "../validation/schemas.js";

const rowsWriteShapeGuidance =
  'Rows body must use {"filter":{"type":"and","filters":[{"columnName":"id","condition":"eq","value":"row-id"}]},"data":{...}}.';

function assertRowsWriteBodyShape(body: unknown): void {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return;
  }

  if (!("filter" in body) || !("data" in body)) {
    throw new Error(rowsWriteShapeGuidance);
  }
}

export async function listDataTables(
  queryPairs?: string[],
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = parseKeyValuePairs(queryPairs);
  const result = await client.get("/data-tables", query);
  printResult(result);
}

export async function getDataTable(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.get(`/data-tables/${id}`);
  printResult(result);
}

export async function createDataTable(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Data table body is required. Use --data or --file.");
  const validated = validateSchema(dataTableCreateSchema, body);
  const result = await client.post("/data-tables", validated);
  printResult(result);
}

export async function updateDataTable(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Data table body is required. Use --data or --file.");
  const validated = validateSchema(dataTableUpdateSchema, body);
  const result = await client.patch(`/data-tables/${id}`, validated);
  printResult(result);
}

export async function deleteDataTable(id: string, profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const result = await client.delete(`/data-tables/${id}`);
  printResult(result);
}

export async function listRows(
  id: string,
  queryPairs?: string[],
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const query = parseKeyValuePairs(queryPairs);
  const result = await client.get(`/data-tables/${id}/rows`, query);
  printResult(result);
}

export async function insertRows(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Rows body is required. Use --data or --file.");
  const validated = validateSchema(dataTableInsertRowsSchema, body);
  const result = await client.post(`/data-tables/${id}/rows`, validated);
  printResult(result);
}

export async function updateRows(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Rows body is required. Use --data or --file.");
  assertRowsWriteBodyShape(body);
  const validated = validateSchema(dataTableUpdateRowsSchema, body);
  const result = await client.patch(`/data-tables/${id}/rows/update`, validated);
  printResult(result);
}

export async function upsertRows(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Rows body is required. Use --data or --file.");
  assertRowsWriteBodyShape(body);
  const validated = validateSchema(dataTableUpsertRowsSchema, body);
  const result = await client.post(`/data-tables/${id}/rows/upsert`, validated);
  printResult(result);
}

export async function deleteRows(
  id: string,
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  if (!body) throw new Error("Rows delete body is required. Use --data or --file.");
  const result = await client.request("DELETE", `/data-tables/${id}/rows/delete`, { body });
  printResult(result);
}
