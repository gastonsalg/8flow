# n8n-cli

Simple CLI for interacting with n8n instances using API keys.

API compatibility: targets the n8n Public API at `/api/v1` as defined by `docs/n8n.openapi.json` (info.version `1.1.1`).

Disclaimer: This is an unofficial community project and is not affiliated with, endorsed by, or sponsored by n8n GmbH.

## Setup

Install dependencies:

```
npm install
```

`npm install` triggers an automatic build (`postinstall`) so `dist/` is ready.

Generate OpenAPI types (optional):

```
npm run gen:api
```

## Usage

For a local CLI install:

```
npm run build
npm link
8flow --help
```

Publishing note: `prepublishOnly` runs `npm run build` to ensure `dist/` is up to date.

Tests:

```
npm test
```

Add a profile:

```
8flow profiles add
```

List profiles:

```
8flow profiles list
```

Set active profile:

```
8flow profiles use <name>
```

Use a specific profile without switching:

```
8flow workflows list --profile <name>
```

Print compact JSON across commands:

```
8flow --no-pretty workflows list
```

Test auth:

```
8flow auth test
```

List workflows:

```
8flow workflows list
```

Raw requests (any endpoint):

```
8flow raw GET /workflows
8flow raw POST /tags --data '{"name":"Ops"}'
```

Executions:

```
8flow executions list --query limit=10
8flow executions list --query limit=10 --include-data
8flow executions list --fields id status --jsonl
8flow executions get <id>
8flow executions get <id> --include-data
8flow executions debug <id>
8flow executions retry <id>
8flow executions delete <id>
```

Workflows:

```
8flow workflows get <id>
8flow workflows get <id> --exclude-pinned-data
8flow workflows list --fields id name active --jsonl
8flow workflows create --file examples/workflows/create.json
8flow workflows update <id> --file examples/workflows/update.json
8flow workflows activate <id>
8flow workflows deactivate <id>
8flow workflows tags get <id>
8flow workflows tags set <id> --file examples/workflows/tags/set.json
```

Credentials:

```
8flow credentials schema <credentialTypeName>
8flow credentials create --file examples/credentials/create.json
8flow credentials update <id> --file examples/credentials/update.json
8flow credentials delete <id>
```

Tags:

```
8flow tags list
8flow tags get <id>
8flow tags create --file examples/tags/create.json
8flow tags update <id> --file examples/tags/update.json
8flow tags delete <id>
```

Variables:

```
8flow variables list
8flow variables create --file examples/variables/create.json
8flow variables update <id> --file examples/variables/update.json
8flow variables delete <id>
```

Projects:

```
8flow projects list
8flow projects create --file examples/projects/create.json
8flow projects update <projectId> --file examples/projects/update.json
8flow projects delete <projectId>
8flow projects users add <projectId> --data '{"userId":"1","role":"admin"}'
8flow projects users update <projectId> <userId> --data '{"role":"member"}'
8flow projects users remove <projectId> <userId>
```

Data Tables:

```
8flow data-tables list
8flow data-tables create --file examples/data-tables/create.json
8flow data-tables get <dataTableId>
8flow data-tables update <dataTableId> --file examples/data-tables/update.json
8flow data-tables rows list <dataTableId>
8flow data-tables rows insert <dataTableId> --file examples/data-tables/rows/insert.json
8flow data-tables rows update <dataTableId> --file examples/data-tables/rows/update.json
8flow data-tables rows upsert <dataTableId> --file examples/data-tables/rows/upsert.json
8flow data-tables rows delete <dataTableId> --file examples/data-tables/rows/delete.json
```

Source Control:

```
8flow source-control pull
```
