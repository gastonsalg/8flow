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
n8n --help
```

Publishing note: `prepublishOnly` runs `npm run build` to ensure `dist/` is up to date.

Tests:

```
npm test
```

Add a profile:

```
n8n profiles add
```

List profiles:

```
n8n profiles list
```

Set active profile:

```
n8n profiles use <name>
```

Use a specific profile without switching:

```
n8n workflows list --profile <name>
```

Test auth:

```
n8n auth test
```

List workflows:

```
n8n workflows list
```

Raw requests (any endpoint):

```
n8n raw GET /workflows
n8n raw POST /tags --data '{"name":"Ops"}'
```

Executions:

```
n8n executions list --query limit=10
n8n executions get <id>
n8n executions retry <id>
n8n executions delete <id>
```

Workflows:

```
n8n workflows get <id>
n8n workflows create --file examples/workflows/create.json
n8n workflows update <id> --file examples/workflows/update.json
n8n workflows activate <id>
n8n workflows deactivate <id>
n8n workflows tags get <id>
n8n workflows tags set <id> --file examples/workflows/tags/set.json
```

Credentials:

```
n8n credentials schema <credentialTypeName>
n8n credentials create --file examples/credentials/create.json
n8n credentials update <id> --file examples/credentials/update.json
n8n credentials delete <id>
```

Tags:

```
n8n tags list
n8n tags get <id>
n8n tags create --file examples/tags/create.json
n8n tags update <id> --file examples/tags/update.json
n8n tags delete <id>
```

Variables:

```
n8n variables list
n8n variables create --file examples/variables/create.json
n8n variables update <id> --file examples/variables/update.json
n8n variables delete <id>
```

Projects:

```
n8n projects list
n8n projects create --file examples/projects/create.json
n8n projects update <projectId> --file examples/projects/update.json
n8n projects delete <projectId>
n8n projects users add <projectId> --data '{"userId":"1","role":"admin"}'
n8n projects users update <projectId> <userId> --data '{"role":"member"}'
n8n projects users remove <projectId> <userId>
```

Data Tables:

```
n8n data-tables list
n8n data-tables create --file examples/data-tables/create.json
n8n data-tables get <dataTableId>
n8n data-tables update <dataTableId> --file examples/data-tables/update.json
n8n data-tables rows list <dataTableId>
n8n data-tables rows insert <dataTableId> --file examples/data-tables/rows/insert.json
n8n data-tables rows update <dataTableId> --file examples/data-tables/rows/update.json
n8n data-tables rows upsert <dataTableId> --file examples/data-tables/rows/upsert.json
n8n data-tables rows delete <dataTableId> --file examples/data-tables/rows/delete.json
```

Source Control:

```
n8n source-control pull
```
