import { z } from "zod";

const nonEmptyString = z.string().min(1, "Required");

export const tagSchema = z.object({
  name: nonEmptyString,
});

export const workflowSchema = z.object({
  name: nonEmptyString,
  nodes: z.array(z.any()),
  connections: z.record(z.any()),
  settings: z.record(z.any()),
});

export const workflowTagsSchema = z.array(z.any());

export const credentialSchema = z.object({
  name: nonEmptyString,
  type: nonEmptyString,
  data: z.record(z.any()),
});

export const credentialUpdateSchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    data: z.record(z.any()).optional(),
    isGlobal: z.boolean().optional(),
    isResolvable: z.boolean().optional(),
    isPartialData: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const variableSchema = z.object({
  key: nonEmptyString,
  value: z.any(),
  type: z.string().optional(),
  projectId: z.string().optional(),
});

export const variableUpdateSchema = z
  .object({
    key: nonEmptyString.optional(),
    value: z.any().optional(),
    type: z.string().optional(),
    projectId: z.string().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export const projectSchema = z.object({
  name: nonEmptyString,
  type: z.string().optional(),
});

export const dataTableCreateSchema = z.object({
  name: nonEmptyString,
  columns: z.array(z.any()),
});

export const dataTableUpdateSchema = z.object({
  name: nonEmptyString,
});

export const dataTableInsertRowsSchema = z.object({
  data: z.array(z.record(z.any())),
  returnType: z.string().optional(),
});

export const dataTableUpdateRowsSchema = z.object({
  filter: z.record(z.any()),
  data: z.record(z.any()),
  returnData: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

export const dataTableUpsertRowsSchema = dataTableUpdateRowsSchema;

export function validateSchema<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(`Validation error: ${message}`);
  }
  return result.data;
}
