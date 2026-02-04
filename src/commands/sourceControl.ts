import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";
import { parseJsonInput, printResult } from "./helpers.js";

export async function pullSourceControl(
  data?: string,
  file?: string,
  profileName?: string,
): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  const body = parseJsonInput(data, file);
  const result = await client.post("/source-control/pull", body);
  printResult(result);
}
