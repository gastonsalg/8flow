import assert from "node:assert/strict";
import test from "node:test";
import {
  credentialSchema,
  credentialUpdateSchema,
  tagSchema,
  workflowSchema,
} from "../src/validation/schemas.js";

const workflow = {
  name: "Demo",
  nodes: [],
  connections: {},
  settings: {},
};

test("workflowSchema requires name, nodes, connections, settings", () => {
  assert.deepEqual(workflowSchema.parse(workflow), workflow);
  assert.throws(() => workflowSchema.parse({}), /Required/);
});

test("tagSchema requires name", () => {
  assert.deepEqual(tagSchema.parse({ name: "Ops" }), { name: "Ops" });
  assert.throws(() => tagSchema.parse({}), /Required/);
});

test("credentialSchema requires name/type/data", () => {
  const valid = { name: "Cred", type: "httpBasicAuth", data: {} };
  assert.deepEqual(credentialSchema.parse(valid), valid);
  assert.throws(() => credentialSchema.parse({ name: "Cred" }), /Required/);
});

test("credentialUpdateSchema requires at least one field", () => {
  assert.deepEqual(credentialUpdateSchema.parse({ name: "New" }), { name: "New" });
  assert.throws(() => credentialUpdateSchema.parse({}), /At least one field/);
});
