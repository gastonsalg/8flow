#!/usr/bin/env node
import { Command } from "commander";
import { addProfile, listProfiles, showActiveProfile, useProfile } from "./commands/profiles.js";
import { authTest } from "./commands/auth.js";
import { rawRequest } from "./commands/raw.js";
import {
  activateWorkflow,
  createWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  getWorkflow,
  getWorkflowTags,
  listWorkflows,
  setWorkflowTags,
  updateWorkflow,
  validateWorkflow,
} from "./commands/workflows.js";
import { triggerWebhook } from "./commands/webhooks.js";
import {
  debugExecution,
  deleteExecution,
  getExecution,
  listExecutions,
  retryExecution,
} from "./commands/executions.js";
import {
  createCredential,
  deleteCredential,
  getCredentialSchema,
  updateCredential,
} from "./commands/credentials.js";
import { createTag, deleteTag, getTag, listTags, updateTag } from "./commands/tags.js";
import { createVariable, deleteVariable, listVariables, updateVariable } from "./commands/variables.js";
import {
  addProjectUser,
  createProject,
  deleteProject,
  listProjects,
  removeProjectUser,
  updateProject,
  updateProjectUser,
} from "./commands/projects.js";
import {
  createDataTable,
  deleteDataTable,
  deleteRows,
  getDataTable,
  insertRows,
  listDataTables,
  listRows,
  updateDataTable,
  updateRows,
  upsertRows,
} from "./commands/dataTables.js";
import { pullSourceControl } from "./commands/sourceControl.js";
import { setDefaultPretty } from "./commands/helpers.js";

const program = new Command();

program
  .name("8flow")
  .description("CLI for n8n instances")
  .option("--no-pretty", "Print compact JSON for all commands")
  .version("0.1.0");

program.hook("preAction", (thisCommand) => {
  const command = thisCommand as Command & { optsWithGlobals?: () => Record<string, unknown> };
  const options = command.optsWithGlobals ? command.optsWithGlobals() : program.opts();
  setDefaultPretty(options.pretty !== false);
});

const profiles = program.command("profiles").description("Manage n8n instance profiles");

profiles
  .command("add")
  .description("Add a new profile")
  .action(async () => {
    await addProfile();
  });

profiles
  .command("list")
  .description("List profiles")
  .action(() => {
    listProfiles();
  });

profiles
  .command("use")
  .description("Set active profile")
  .argument("<name>", "Profile name")
  .action((name: string) => {
    useProfile(name);
  });

profiles
  .command("active")
  .description("Show active profile")
  .action(() => {
    showActiveProfile();
  });

const auth = program.command("auth").description("Authentication commands");

auth
  .command("test")
  .description("Test authentication against the active profile")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { profile?: string }) => {
    await authTest(options.profile);
  });

const workflows = program.command("workflows").description("Workflow commands");

workflows
  .command("list")
  .description("List workflows")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("--fields <field...>", "Output fields (supports dotted paths)")
  .option("--jsonl", "Print one JSON object per line")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { query?: string[]; fields?: string[]; jsonl?: boolean; profile?: string }) => {
    await listWorkflows(options.query, options.profile, options.fields, options.jsonl);
  });

workflows
  .command("get")
  .description("Get a workflow by id")
  .argument("<id>", "Workflow id")
  .option("--exclude-pinned-data", "Exclude workflow pinned data from response")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { excludePinnedData?: boolean; profile?: string }) => {
    await getWorkflow(id, options.excludePinnedData, options.profile);
  });

workflows
  .command("create")
  .description("Create a workflow from JSON")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createWorkflow(options.data, options.file, options.profile);
  });

workflows
  .command("update")
  .description("Update a workflow by id (full payload)")
  .argument("<id>", "Workflow id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateWorkflow(id, options.data, options.file, options.profile);
  });

workflows
  .command("validate")
  .description("Validate a workflow payload locally, with optional server-backed checks")
  .option("--id <id>", "Validate an existing workflow by id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("--server", "Run server-backed checks (non-mutating)")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(
    async (options: { id?: string; data?: string; file?: string; server?: boolean; profile?: string }) => {
      await validateWorkflow(options);
    },
  );

workflows
  .command("delete")
  .description("Delete a workflow by id")
  .argument("<id>", "Workflow id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deleteWorkflow(id, options.profile);
  });

workflows
  .command("activate")
  .description("Activate a workflow by id")
  .argument("<id>", "Workflow id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await activateWorkflow(id, options.profile);
  });

workflows
  .command("deactivate")
  .description("Deactivate a workflow by id")
  .argument("<id>", "Workflow id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deactivateWorkflow(id, options.profile);
  });

const workflowTags = workflows.command("tags").description("Manage workflow tags");

workflowTags
  .command("get")
  .description("List tags for a workflow")
  .argument("<id>", "Workflow id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await getWorkflowTags(id, options.profile);
  });

workflowTags
  .command("set")
  .description("Set tags for a workflow")
  .argument("<id>", "Workflow id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { data?: string; file?: string; profile?: string }) => {
    await setWorkflowTags(id, options.data, options.file, options.profile);
  });

const workflowTrigger = workflows.command("trigger").description("Trigger workflows through explicit execution surfaces");

workflowTrigger
  .command("webhook")
  .description("Trigger a workflow through a webhook id, webhook path, or full URL")
  .requiredOption(
    "--path <path-or-url>",
    "Webhook id, /webhook/... path, /webhook-test/... path, or full URL",
  )
  .option("-X, --method <method>", "HTTP method", "POST")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("--data-file <path>", "Path to JSON file")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("-H, --header <pair...>", "HTTP headers (key=value)")
  .option("--wait", "Reserved for polling execution state after the webhook response")
  .option("--follow", "Reserved for streaming execution progress after the webhook response")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(
    async (options: {
      path: string;
      method?: string;
      data?: string;
      file?: string;
      dataFile?: string;
      query?: string[];
      header?: string[];
      pretty?: boolean;
      profile?: string;
      wait?: boolean;
      follow?: boolean;
    }) => {
      await triggerWebhook(options.path, options);
    },
  );

const executions = program.command("executions").description("Execution commands");

executions
  .command("list")
  .description("List executions")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("--include-data", "Include execution run data payloads")
  .option("--fields <field...>", "Output fields (supports dotted paths)")
  .option("--jsonl", "Print one JSON object per line")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(
    async (options: { query?: string[]; includeData?: boolean; fields?: string[]; jsonl?: boolean; profile?: string }) => {
      await listExecutions(
        options.query,
        options.profile,
        options.includeData,
        options.fields,
        options.jsonl,
      );
    },
  );

executions
  .command("get")
  .description("Get an execution by id")
  .argument("<id>", "Execution id")
  .option("--include-data", "Include execution run data payload")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { includeData?: boolean; profile?: string }) => {
    await getExecution(id, options.includeData, options.profile);
  });

executions
  .command("debug")
  .description("Get an execution with full run data (debug shortcut)")
  .argument("<id>", "Execution id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await debugExecution(id, options.profile);
  });

executions
  .command("delete")
  .description("Delete an execution by id")
  .argument("<id>", "Execution id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deleteExecution(id, options.profile);
  });

executions
  .command("retry")
  .description("Retry an execution by id")
  .argument("<id>", "Execution id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await retryExecution(id, options.profile);
  });

const credentials = program.command("credentials").description("Credential commands");

credentials
  .command("create")
  .description("Create a credential")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createCredential(options.data, options.file, options.profile);
  });

credentials
  .command("update")
  .description("Update a credential by id")
  .argument("<id>", "Credential id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateCredential(id, options.data, options.file, options.profile);
  });

credentials
  .command("delete")
  .description("Delete a credential by id")
  .argument("<id>", "Credential id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deleteCredential(id, options.profile);
  });

credentials
  .command("schema")
  .description("Get a credential schema by type name")
  .argument("<credentialTypeName>", "Credential type name")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (credentialTypeName: string, options: { profile?: string }) => {
    await getCredentialSchema(credentialTypeName, options.profile);
  });

const tags = program.command("tags").description("Tag commands");

tags
  .command("list")
  .description("List tags")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { profile?: string }) => {
    await listTags(options.profile);
  });

tags
  .command("get")
  .description("Get a tag by id")
  .argument("<id>", "Tag id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await getTag(id, options.profile);
  });

tags
  .command("create")
  .description("Create a tag")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createTag(options.data, options.file, options.profile);
  });

tags
  .command("update")
  .description("Update a tag by id")
  .argument("<id>", "Tag id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateTag(id, options.data, options.file, options.profile);
  });

tags
  .command("delete")
  .description("Delete a tag by id")
  .argument("<id>", "Tag id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deleteTag(id, options.profile);
  });

const variables = program.command("variables").description("Variable commands");

variables
  .command("list")
  .description("List variables")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { profile?: string }) => {
    await listVariables(options.profile);
  });

variables
  .command("create")
  .description("Create a variable")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createVariable(options.data, options.file, options.profile);
  });

variables
  .command("update")
  .description("Update a variable by id")
  .argument("<id>", "Variable id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateVariable(id, options.data, options.file, options.profile);
  });

variables
  .command("delete")
  .description("Delete a variable by id")
  .argument("<id>", "Variable id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (id: string, options: { profile?: string }) => {
    await deleteVariable(id, options.profile);
  });

const projects = program.command("projects").description("Project commands");

projects
  .command("list")
  .description("List projects")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { profile?: string }) => {
    await listProjects(options.profile);
  });

projects
  .command("create")
  .description("Create a project")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createProject(options.data, options.file, options.profile);
  });

projects
  .command("update")
  .description("Update a project by id")
  .argument("<projectId>", "Project id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (projectId: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateProject(projectId, options.data, options.file, options.profile);
  });

projects
  .command("delete")
  .description("Delete a project by id")
  .argument("<projectId>", "Project id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (projectId: string, options: { profile?: string }) => {
    await deleteProject(projectId, options.profile);
  });

const projectUsers = projects.command("users").description("Manage project users");

projectUsers
  .command("add")
  .description("Add a user to a project")
  .argument("<projectId>", "Project id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (projectId: string, options: { data?: string; file?: string; profile?: string }) => {
    await addProjectUser(projectId, options.data, options.file, options.profile);
  });

projectUsers
  .command("update")
  .description("Update a project user by id")
  .argument("<projectId>", "Project id")
  .argument("<userId>", "User id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(
    async (
      projectId: string,
      userId: string,
      options: { data?: string; file?: string; profile?: string }
    ) => {
      await updateProjectUser(projectId, userId, options.data, options.file, options.profile);
    }
  );

projectUsers
  .command("remove")
  .description("Remove a user from a project")
  .argument("<projectId>", "Project id")
  .argument("<userId>", "User id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (projectId: string, userId: string, options: { profile?: string }) => {
    await removeProjectUser(projectId, userId, options.profile);
  });

const dataTables = program.command("data-tables").description("Data tables commands");

dataTables
  .command("list")
  .description("List data tables")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { query?: string[]; profile?: string }) => {
    await listDataTables(options.query, options.profile);
  });

dataTables
  .command("get")
  .description("Get a data table by id")
  .argument("<dataTableId>", "Data table id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { profile?: string }) => {
    await getDataTable(dataTableId, options.profile);
  });

dataTables
  .command("create")
  .description("Create a data table")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await createDataTable(options.data, options.file, options.profile);
  });

dataTables
  .command("update")
  .description("Update a data table by id")
  .argument("<dataTableId>", "Data table id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateDataTable(dataTableId, options.data, options.file, options.profile);
  });

dataTables
  .command("delete")
  .description("Delete a data table by id")
  .argument("<dataTableId>", "Data table id")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { profile?: string }) => {
    await deleteDataTable(dataTableId, options.profile);
  });

const dataRows = dataTables.command("rows").description("Manage data table rows");

dataRows
  .command("list")
  .description("List rows for a data table")
  .argument("<dataTableId>", "Data table id")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { query?: string[]; profile?: string }) => {
    await listRows(dataTableId, options.query, options.profile);
  });

dataRows
  .command("insert")
  .description("Insert rows into a data table")
  .argument("<dataTableId>", "Data table id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { data?: string; file?: string; profile?: string }) => {
    await insertRows(dataTableId, options.data, options.file, options.profile);
  });

dataRows
  .command("update")
  .description("Update rows in a data table")
  .argument("<dataTableId>", "Data table id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { data?: string; file?: string; profile?: string }) => {
    await updateRows(dataTableId, options.data, options.file, options.profile);
  });

dataRows
  .command("upsert")
  .description("Upsert rows in a data table")
  .argument("<dataTableId>", "Data table id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { data?: string; file?: string; profile?: string }) => {
    await upsertRows(dataTableId, options.data, options.file, options.profile);
  });

dataRows
  .command("delete")
  .description("Delete rows from a data table")
  .argument("<dataTableId>", "Data table id")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (dataTableId: string, options: { data?: string; file?: string; profile?: string }) => {
    await deleteRows(dataTableId, options.data, options.file, options.profile);
  });

const sourceControl = program.command("source-control").description("Source control commands");

sourceControl
  .command("pull")
  .description("Pull from source control (if enabled)")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(async (options: { data?: string; file?: string; profile?: string }) => {
    await pullSourceControl(options.data, options.file, options.profile);
  });

program
  .command("raw")
  .description("Call any n8n API endpoint")
  .argument("<method>", "HTTP method (GET, POST, PUT, PATCH, DELETE)")
  .argument("<path>", "Path under /api/v1 (e.g. /workflows)")
  .option("-d, --data <json>", "Inline JSON body")
  .option("-f, --file <path>", "Path to JSON file")
  .option("-q, --query <pair...>", "Query parameters (key=value)")
  .option("-H, --header <pair...>", "Extra headers (key=value)")
  .option("--no-pretty", "Print compact JSON")
  .option("-p, --profile <name>", "Use named profile for this command")
  .action(
    async (
      method: string,
      path: string,
      options: {
        data?: string;
        file?: string;
        query?: string[];
        header?: string[];
        pretty?: boolean;
        profile?: string;
      }
    ) => {
      await rawRequest(method, path, options);
    }
  );

program.parseAsync(process.argv).catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
});
