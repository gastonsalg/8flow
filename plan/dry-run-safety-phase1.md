# Add Global Dry-Run Safety Mode for Mutating Commands

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, users can run any write operation in `8flow` with a dry-run switch that validates input and prints the HTTP request that would be sent, without changing anything in n8n. This adds a safety layer for production usage and makes change previews auditable. A user can prove it works by running a create or delete command with `--dry-run` and seeing a dry-run report with method, endpoint, query, and body while no network call is made.

## Progress

- [x] (2026-02-28 11:24Z) Created this ExecPlan for Phase 1 dry-run safety mode.
- [ ] Add a global dry-run runtime flag and helper utilities.
- [ ] Thread dry-run behavior through all mutating command handlers.
- [ ] Add dry-run support to `raw` for mutating HTTP methods.
- [ ] Add tests proving no network call happens in dry-run mode.
- [ ] Update README with dry-run usage and examples.
- [ ] Run `npm test` and `npm run build` and record evidence.

## Surprises & Discoveries

- Observation: `src/index.ts` currently exposes a global output flag (`--no-pretty`) through a `preAction` hook, which is a clean insertion point for another global behavior flag.
  Evidence: `program.hook("preAction", ...)` reads global options and configures helpers.
- Observation: Command modules call `createClient(profile)` and invoke HTTP methods directly (`post`, `put`, `patch`, `delete`) without a shared mutating-operation guard.
  Evidence: `src/commands/*.ts` each instantiate `createClient` and call client methods directly.
- Observation: `raw` already routes all HTTP methods through `client.request`, so dry-run for raw can be centralized by method classification.
  Evidence: `src/commands/raw.ts` builds request options and dispatches to `client.request(method, path, options)`.

## Decision Log

- Decision: Phase 1 will implement dry-run only; config-file targeting and environment policy guardrails are explicitly deferred to a later plan.
  Rationale: `--dry-run` is highest-impact and lowest-risk, and it can be added without changing profile storage format.
  Date/Author: 2026-02-28 / Codex
- Decision: Dry-run output will show a deterministic request preview (`method`, resolved path/query, target base URL, body/headers with API key redacted) and exit with success.
  Rationale: Operators need inspectable intent before applying mutations; deterministic output improves automation and review.
  Date/Author: 2026-02-28 / Codex
- Decision: Read-only commands ignore `--dry-run`; mutating commands honor it.
  Rationale: Prevents confusing no-op behavior for read operations and preserves existing UX.
  Date/Author: 2026-02-28 / Codex

## Outcomes & Retrospective

This plan is in draft state. No dry-run behavior has been implemented yet. Expected outcome is a safe no-op preview path for every mutating command, with tests verifying that dry-run never reaches `fetch`.

## Context and Orientation

`8flow` is a TypeScript CLI with command registration in `src/index.ts`, HTTP transport in `src/api/client.ts`, and per-resource operations in `src/commands/*`. The API client currently performs real requests immediately. Runtime output and helper behavior are centralized in `src/commands/helpers.ts`.

For this plan, a “mutating command” means any command that can change server state (for example create, update, delete, activate, deactivate, retry, or tag-set operations). A “dry run” means the command validates and prepares the request but does not perform a network request.

Primary files for this work:

- `src/index.ts`: add global `--dry-run` option and pass it to command actions.
- `src/commands/helpers.ts` (or a new `src/commands/runtime.ts`): store/read dry-run mode and print standardized dry-run preview output.
- `src/api/client.ts`: optionally expose a reusable request-preview builder used by commands.
- `src/commands/*.ts`: apply dry-run branching for mutating operations.
- `src/commands/raw.ts`: classify mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) and support dry-run previews.
- `test/cli-mock.test.ts` and any focused command tests: assert dry-run output and assert no `fetch` invocation.
- `README.md`: document `--dry-run` behavior and examples.

Mutating command coverage in current CLI surface:

- `workflows`: `create`, `update`, `delete`, `activate`, `deactivate`, `tags set`
- `executions`: `delete`, `retry`
- `credentials`: `create`, `update`, `delete`
- `tags`: `create`, `update`, `delete`
- `variables`: `create`, `update`, `delete`
- `projects`: `create`, `update`, `delete`, `users add`, `users update`, `users remove`
- `data-tables`: `create`, `update`, `delete`, `rows insert`, `rows update`, `rows upsert`, `rows delete`
- `source-control`: `pull`
- `raw`: mutating methods only

## Plan of Work

Milestone 1 establishes the dry-run runtime contract. Add a global `--dry-run` option in `src/index.ts`, similar to `--no-pretty`, and persist it in shared runtime helper state available to all command modules. Define a single function for printing dry-run previews so output format stays consistent.

Milestone 2 applies dry-run behavior to mutating commands. For each mutating action in `src/commands/*`, keep current validation and payload parsing, but branch before network execution: if dry-run is enabled, print preview and return. Read-only commands must continue normal behavior regardless of `--dry-run`.

Milestone 3 covers `raw` command parity and tests. `raw` with `POST/PUT/PATCH/DELETE` should respect dry-run and print preview; `GET` remains live and should print a note that dry-run is not applicable. Add tests that verify a dry-run mutating command produces preview output and does not call `fetch`.

Milestone 4 updates docs and final validation. Update README with global flag docs and examples, then run full tests and build. Record proof in this plan.

## Concrete Steps

Run all commands from repository root (`<repo-root>`).

1. Create a feature branch:

    git checkout -b codex/feature/dry-run-safety-phase1

2. Add runtime dry-run state and helpers:

    # edit src/index.ts and src/commands/helpers.ts (or add src/commands/runtime.ts)

3. Implement dry-run branches for mutating commands:

    # edit command modules under src/commands/

4. Add/extend tests:

    npm test

5. Build and verify:

    npm run build

6. Optional manual smoke checks:

    npm link
    8flow --dry-run workflows create --file examples/workflows/create.json
    8flow --dry-run workflows delete 123
    8flow --dry-run raw POST /tags --data '{"name":"Ops"}'

Expected dry-run output shape (example):

    [dry-run] request preview
    method: POST
    url: https://example.n8n.cloud/api/v1/tags
    profile: prod
    headers: Content-Type=application/json, X-N8N-API-KEY=****
    body: {"name":"Ops"}

## Validation and Acceptance

Acceptance criteria:

- All mutating commands listed in this plan support `--dry-run` and do not perform network calls.
- Read-only commands remain unchanged and continue to execute real reads.
- `raw` honors dry-run for mutating methods and leaves GET behavior unchanged.
- `npm test` passes, including new dry-run assertions.
- `npm run build` passes.
- README includes at least one dry-run example for both typed command and `raw`.

A command is accepted as dry-run-safe when:

- It still validates input and required arguments.
- It prints a request preview with redacted API key.
- It exits 0 without invoking `fetch`.

## Idempotence and Recovery

Dry-run behavior is additive and safe to re-run. If partial implementation causes inconsistent behavior, revert only affected command module changes and keep the runtime flag scaffolding intact. Tests should be run after each command-family rollout to detect coverage gaps early.

If output format changes during implementation, update all dry-run tests in the same commit to keep assertions deterministic.

## Artifacts and Notes

Expected changed files:

- `src/index.ts`
- `src/commands/helpers.ts` (or new `src/commands/runtime.ts`)
- Mutating command modules under `src/commands/`
- `test/cli-mock.test.ts` and/or new dry-run-focused tests
- `README.md`

Expected non-goals for Phase 1:

- No profile schema change.
- No config file (`--config`) feature yet.
- No interactive confirmation prompts yet.

## Interfaces and Dependencies

No new npm dependencies are required.

At the end of this milestone, the codebase should include a stable runtime interface for dry-run checks, for example:

- `setDryRunEnabled(enabled: boolean): void`
- `isDryRunEnabled(): boolean`
- `printDryRunPreview(input: { method: string; path: string; query?: Record<string, unknown>; body?: unknown; profileName?: string; baseUrl?: string }): void`

If equivalent names are chosen, keep the contract centralized so command modules do not duplicate dry-run formatting logic.

Appendix: change log entry

- Change note: Created Phase 1 ExecPlan for global dry-run safety mode inspired by operational safeguards seen in other community CLIs. Reason: user requested a new implementation plan to bring safety-oriented features into `8flow`.
