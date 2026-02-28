# Rename the Published CLI Command to a Neutral, Non-Brand Name

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, users will invoke this tool with a new terminal command that does not use the vendor brand name, while preserving all existing behavior and API functionality. The repository name and package internals are intentionally out of scope. A user can verify success by installing or linking the package, running the new command for help output, and confirming README examples use the new command consistently.

## Progress

- [x] (2026-02-27 23:59Z) Created this ExecPlan with scoped rename rules focused on terminal command and documentation only.
- [x] (2026-02-28 10:58Z) Selected and locked the new terminal command token as `8flow`.
- [x] (2026-02-28 10:58Z) Renamed executable mapping in `package.json`, Commander root name in `src/index.ts`, and user-facing command hints in source files.
- [x] (2026-02-28 10:58Z) Updated README command examples from `n8n ...` to `8flow ...`; no test fixture updates were required.
- [x] (2026-02-28 10:58Z) Ran `npm test`, `npm run build`, `npm link`, and `8flow --help` successfully.

## Surprises & Discoveries

- Observation: The actual executable command is currently controlled by `package.json` under the `bin` field, and CLI help text is defined separately in `src/index.ts` with `.name("n8n")`.
  Evidence: `package.json` includes `"bin": { "n8n": "dist/index.js" }`, and `src/index.ts` contains `.name("n8n")`.
- Observation: User-facing command examples are concentrated in `README.md`, with many explicit invocations that currently start with `n8n`.
  Evidence: `README.md` contains repeated examples such as `n8n profiles add`, `n8n workflows list`, and `n8n raw GET /workflows`.
- Observation: Existing tests validate command behavior and request construction but do not hard-assert the root executable token string, so rename required no test expectation edits.
  Evidence: `npm test` passed (36/36) immediately after the command-token rename.

## Decision Log

- Decision: Keep scope strictly limited to command token rename and documentation updates; do not rename repository, package name, config directory, or API protocol behavior.
  Rationale: The stated goal is publish-safe command naming with minimal risk and no broad migration.
  Date/Author: 2026-02-27 / Codex
- Decision: Implement a one-step command migration (old command removed immediately) unless maintainers explicitly request an alias window.
  Rationale: A single command reduces ambiguity in docs and support, and avoids accidental brand reuse.
  Date/Author: 2026-02-27 / Codex
- Decision: Use `8flow` as the final published terminal command token.
  Rationale: User-selected, short to type, and available on npm at implementation time.
  Date/Author: 2026-02-28 / Codex

## Outcomes & Retrospective

The rename was completed with scoped edits only. The package executable now installs as `8flow`, help output is rooted at `8flow`, and README command examples use `8flow`. Validation passed with `npm test` (36 passing), `npm run build`, and runtime help verification via `npm link` + `8flow --help`. No regressions were observed in command behavior.

## Context and Orientation

This repository is a TypeScript CLI. The runtime executable name is emitted by Node package tooling from `package.json` `bin` mappings. The internal command title shown in `--help` output is configured in `src/index.ts` via Commander (`program.name(...)`). User documentation with copy/paste commands lives in `README.md`.

The key files for this change are:

- `package.json`: maps command name to `dist/index.js`.
- `src/index.ts`: sets root command display name and contains user-facing error/help text strings.
- `src/config/store.ts` and `src/commands/profiles.ts`: include messages that currently reference `n8n ...` usage.
- `test/cli-mock.test.ts` and any tests asserting usage output: may require string updates if they match literal command names.
- `README.md`: all documented examples and installation/use transcripts.

A “command token” means the executable users type in the terminal, for example `n8n` today. In this plan, `<new-command>` denotes the chosen replacement token.

## Plan of Work

Start by selecting one final token (`<new-command>`) before touching files. Use a name that is short, easy to type, and not identical to the vendor mark. Then update `package.json` `bin` so package installation creates `<new-command>` instead of `n8n`. Next, update `src/index.ts` `program.name(...)` to match `<new-command>`, so help and usage text are consistent.

After the executable rename, update all user-facing examples and guidance in `README.md`, plus any hardcoded guidance messages in source files that currently instruct users to run `n8n ...`. Then run tests and build to ensure no behavior regressions. If any tests rely on exact usage strings, update only the expected command token while preserving test intent.

If maintainers want a temporary compatibility alias, add a second `bin` mapping from `n8n` to `dist/index.js` and clearly mark deprecation in README. If legal/publishing concern requires immediate removal of vendor mark, do not add the alias. This branch should default to immediate removal.

## Concrete Steps

Run all commands from repository root (`<repo-root>`).

1. Create a safe feature branch before editing:

    git checkout -b feature/rename-cli-command

2. Choose `<new-command>` and update executable mapping in `package.json`:

    npm pkg set bin.<new-command>=dist/index.js
    npm pkg delete bin.n8n

3. Update command display name and user guidance strings:

    rg -n "`n8n |\\bn8n\\b" src README.md test
    # edit files found to replace command examples with <new-command>

4. Validate behavior and compile output:

    npm test
    npm run build

5. Verify the new command from a local link install:

    npm link
    <new-command> --help

   Expected result: help output starts with `<new-command>` usage and lists the same subcommands as before.

6. Stage and commit with a narrow message:

    git add package.json README.md src test
    git commit -m "rename cli command to <new-command>"

7. Push and open PR (never push directly to main):

    git push -u origin feature/rename-cli-command
    gh pr create --title "Rename CLI command to <new-command>" --body "Renames terminal command and docs only."

## Validation and Acceptance

Acceptance is behavioral and user-visible:

- Running `<new-command> --help` succeeds and shows usage rooted at `<new-command>`.
- Running a known command path such as `<new-command> profiles list` behaves exactly like the old command behavior.
- `README.md` contains no primary usage examples that still start with `n8n `.
- `npm test` passes.
- `npm run build` passes.

A quick verification transcript should look like:

    $ <new-command> --help
    Usage: <new-command> [options] [command]
    ...

    $ <new-command> profiles list
    ...

## Idempotence and Recovery

These steps are safe to repeat. Re-running edits and tests does not create destructive side effects. If a partial rename breaks help text or tests, restore only the affected files from Git history and re-apply the rename consistently. If `npm link` points to stale output, rerun `npm run build` and `npm link`.

If a publish-safety review later requires different naming, repeat this same plan with a new token and a focused follow-up PR.

## Artifacts and Notes

Expected diff scope should remain narrow and should not alter API request logic:

- `package.json`: `bin` key changed from `n8n` to `8flow`.
- `src/index.ts`: `program.name("8flow")`.
- `README.md`: command examples updated to `8flow ...`.
- `src/config/store.ts` and `src/commands/profiles.ts`: user guidance strings updated to `8flow ...`.

Suggested neutral candidate names to evaluate before locking `<new-command>`:

- `nflow`
- `workflowctl`
- `pipeops`

Selection criteria: low trademark risk, clear CLI meaning, easy terminal typing, and availability on npm package/bin namespace.

## Interfaces and Dependencies

No new dependencies are needed. Existing interfaces and command modules remain unchanged. This change modifies only:

- CLI executable mapping in `package.json`.
- Commander root name in `src/index.ts`.
- User-facing documentation and text references.

The HTTP client contract, authentication header (`X-N8N-API-KEY`), and endpoint serialization behavior must remain untouched.

Appendix: change log entry

- Change note: Created a dedicated ExecPlan for command-token rename and publication-safe naming, scoped to executable command plus documentation. Reason: user requested a focused rename plan without repository/package identity changes.
- Change note: Executed the rename with final token `8flow`, updated docs/user hints, and validated with tests/build/runtime help output. Reason: user approved `8flow` and requested proceeding.
