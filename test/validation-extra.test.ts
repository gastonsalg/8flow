import assert from "node:assert/strict";
import test from "node:test";
import {
  dataTableCreateSchema,
  dataTableInsertRowsSchema,
  dataTableUpdateRowsSchema,
  dataTableUpdateSchema,
  dataTableUpsertRowsSchema,
  projectSchema,
  variableSchema,
} from "../src/validation/schemas.js";

test("variableSchema requires key/value", () => {
  assert.deepEqual(variableSchema.parse({ key: "k", value: 1 }), { key: "k", value: 1 });
  assert.throws(() => variableSchema.parse({}), /Required/);
});

test("projectSchema requires name", () => {
  assert.deepEqual(projectSchema.parse({ name: "A" }), { name: "A" });
  assert.throws(() => projectSchema.parse({}), /Required/);
});

test("dataTableCreateSchema requires name/columns", () => {
  assert.deepEqual(dataTableCreateSchema.parse({ name: "t", columns: [] }), { name: "t", columns: [] });
  assert.throws(() => dataTableCreateSchema.parse({}), /Required/);
});

test("dataTableUpdateSchema requires name", () => {
  assert.deepEqual(dataTableUpdateSchema.parse({ name: "t" }), { name: "t" });
  assert.throws(() => dataTableUpdateSchema.parse({}), /Required/);
});

test("dataTableInsertRowsSchema requires data array", () => {
  assert.deepEqual(dataTableInsertRowsSchema.parse({ data: [] }), { data: [] });
  assert.throws(() => dataTableInsertRowsSchema.parse({}), /Required/);
});

test("dataTableUpdateRowsSchema requires filter/data", () => {
  assert.deepEqual(
    dataTableUpdateRowsSchema.parse({
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }),
    {
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }
  );
  assert.throws(() => dataTableUpdateRowsSchema.parse({}), /Required/);
  assert.deepEqual(
    dataTableUpdateRowsSchema.parse({
      filter: {
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }),
    {
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }
  );
  assert.throws(
    () => dataTableUpdateRowsSchema.parse({ filter: { id: 1 }, data: { name: "x" } }),
    /Required|Invalid enum value/
  );
});

test("dataTableUpsertRowsSchema requires filter/data", () => {
  assert.deepEqual(
    dataTableUpsertRowsSchema.parse({
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }),
    {
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }
  );
  assert.throws(() => dataTableUpsertRowsSchema.parse({}), /Required/);
  assert.deepEqual(
    dataTableUpsertRowsSchema.parse({
      filter: {
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }),
    {
      filter: {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 1 }],
      },
      data: { name: "x" },
    }
  );
});
