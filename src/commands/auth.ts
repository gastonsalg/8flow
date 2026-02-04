import { createClient } from "../api/client.js";
import { getProfile } from "../config/store.js";

export async function authTest(profileName?: string): Promise<void> {
  const profile = getProfile(profileName);
  const client = createClient(profile);
  try {
    await client.get("/workflows");
    console.log("Authenticated successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Authentication failed: ${message}`);
  }
}
