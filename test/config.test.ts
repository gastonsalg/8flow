import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getActiveProfile,
  getProfile,
  getProfileByName,
  loadConfig,
  redactApiKey,
  saveConfig,
  setActiveProfile,
  upsertProfile,
} from "../src/config/store.js";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "8flow-config-"));
process.env.XDG_CONFIG_HOME = tmpRoot;

const profile = {
  name: "local",
  baseUrl: "http://localhost:5678",
  apiKey: "sk_test_123456",
};

test("loadConfig initializes empty store", () => {
  const config = loadConfig();
  assert.equal(config.profiles.length, 0);
});

test("saveConfig and loadConfig roundtrip", () => {
  saveConfig({ profiles: [profile], activeProfile: "local" });
  const config = loadConfig();
  assert.equal(config.activeProfile, "local");
  assert.equal(config.profiles[0]?.name, "local");
});

test("upsertProfile inserts and updates", () => {
  upsertProfile(profile);
  const updated = { ...profile, baseUrl: "http://example" };
  upsertProfile(updated);
  const config = loadConfig();
  assert.equal(config.profiles.length, 1);
  assert.equal(config.profiles[0]?.baseUrl, "http://example");
});

test("setActiveProfile and getActiveProfile", () => {
  setActiveProfile("local");
  const active = getActiveProfile();
  assert.equal(active.name, "local");
});

test("getProfileByName and getProfile with override", () => {
  saveConfig({ profiles: [profile], activeProfile: "local" });
  const byName = getProfileByName("local");
  assert.equal(byName.baseUrl, "http://localhost:5678");
  const viaOverride = getProfile("local");
  assert.equal(viaOverride.apiKey, "sk_test_123456");
});

test("redactApiKey masks secrets", () => {
  assert.equal(redactApiKey("short"), "***");
  assert.equal(redactApiKey("sk_abcdef1234"), "sk_***1234");
});
