import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ConfigStore, Profile } from "./types.js";

const CONFIG_DIR_NAME = "8flow";
const LEGACY_CONFIG_DIR_NAME = "n8n-cli";
const CONFIG_FILE_NAME = "config.json";

const DEFAULT_CONFIG: ConfigStore = { profiles: [] };

function getConfigDir(dirName = CONFIG_DIR_NAME): string {
  const platform = process.platform;
  if (platform === "win32") {
    const appData = process.env.APPDATA;
    return appData ? path.join(appData, dirName) : path.join(os.homedir(), dirName);
  }

  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return path.join(xdg, dirName);
  return path.join(os.homedir(), ".config", dirName);
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILE_NAME);
}

function getLegacyConfigPath(): string {
  return path.join(getConfigDir(LEGACY_CONFIG_DIR_NAME), CONFIG_FILE_NAME);
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadConfig(): ConfigStore {
  ensureConfigDir();
  const filePath = getConfigPath();
  if (!fs.existsSync(filePath)) {
    const legacyPath = getLegacyConfigPath();
    if (fs.existsSync(legacyPath)) {
      try {
        const raw = fs.readFileSync(legacyPath, "utf8");
        const parsed = JSON.parse(raw) as ConfigStore;
        if (parsed.profiles) {
          saveConfig(parsed);
          return parsed;
        }
      } catch {
        // Ignore legacy parse failures and return a fresh config.
      }
    }
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as ConfigStore;
    if (!parsed.profiles) return { ...DEFAULT_CONFIG };
    return parsed;
  } catch (err) {
    const backupPath = `${filePath}.bak`;
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch {
      // Ignore backup failures, we still return a fresh config.
    }
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: ConfigStore): void {
  ensureConfigDir();
  const filePath = getConfigPath();
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2));
  fs.renameSync(tmpPath, filePath);
}

export function upsertProfile(profile: Profile): ConfigStore {
  const config = loadConfig();
  const idx = config.profiles.findIndex((p) => p.name === profile.name);
  if (idx === -1) config.profiles.push(profile);
  else config.profiles[idx] = profile;
  saveConfig(config);
  return config;
}

export function setActiveProfile(name: string): ConfigStore {
  const config = loadConfig();
  const exists = config.profiles.some((p) => p.name === name);
  if (!exists) throw new Error(`Profile not found: ${name}`);
  config.activeProfile = name;
  saveConfig(config);
  return config;
}

export function getActiveProfile(): Profile {
  const config = loadConfig();
  if (!config.activeProfile) throw new Error("No active profile set. Use `8flow profiles use <name>`.");
  const profile = config.profiles.find((p) => p.name === config.activeProfile);
  if (!profile) throw new Error("Active profile is missing. Use `8flow profiles list` to inspect.");
  return profile;
}

export function getProfileByName(name: string): Profile {
  const config = loadConfig();
  const profile = config.profiles.find((p) => p.name === name);
  if (!profile) throw new Error(`Profile not found: ${name}`);
  return profile;
}

export function getProfile(name?: string): Profile {
  if (name) return getProfileByName(name);
  return getActiveProfile();
}

export function redactApiKey(apiKey: string): string {
  if (apiKey.length <= 6) return "***";
  return `${apiKey.slice(0, 3)}***${apiKey.slice(-4)}`;
}
