import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  getActiveProfile,
  loadConfig,
  redactApiKey,
  setActiveProfile,
  upsertProfile,
} from "../config/store.js";
import { Profile } from "../config/types.js";

function promptYesNo(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}

export async function addProfile(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    const name = (await rl.question("Profile name: ")).trim();
    if (!name) throw new Error("Profile name is required.");

    const baseUrl = (await rl.question("Base URL (e.g. https://example.com): ")).trim();
    if (!baseUrl) throw new Error("Base URL is required.");

    const apiKey = (await rl.question("API key (X-N8N-API-KEY): ")).trim();
    if (!apiKey) throw new Error("API key is required.");

    const profile: Profile = { name, baseUrl, apiKey };
    upsertProfile(profile);

    const activate = await rl.question("Set as active profile? (y/N): ");
    if (promptYesNo(activate)) setActiveProfile(name);

    console.log(`Saved profile '${name}'.`);
  } finally {
    rl.close();
  }
}

export function listProfiles(): void {
  const config = loadConfig();
  if (config.profiles.length === 0) {
    console.log("No profiles found. Use `n8n profiles add` to create one.");
    return;
  }

  const active = config.activeProfile;
  for (const profile of config.profiles) {
    const marker = profile.name === active ? "*" : " ";
    console.log(
      `${marker} ${profile.name} (${profile.baseUrl}) key=${redactApiKey(profile.apiKey)}`
    );
  }
}

export function useProfile(name: string): void {
  setActiveProfile(name);
  console.log(`Active profile set to '${name}'.`);
}

export function showActiveProfile(): void {
  const profile = getActiveProfile();
  console.log(`Active profile: ${profile.name} (${profile.baseUrl})`);
}
