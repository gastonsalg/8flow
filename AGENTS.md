# AGENTS.md

## Repository context

- This repo is a Node.js + TypeScript CLI. Entrypoint: `src/index.ts`, build output: `dist/`.
- Primary commands: `npm test` (node:test + tsx) and `npm run build` (tsc).

## Working agreements

- Keep changes minimal and consistent with existing CLI patterns.
- Ask before adding new dependencies or altering scripts.
- Update `README.md` when CLI behavior or usage changes.
- Before creating a release tag or GitHub release, update `package.json` and `package-lock.json` to the release version so local/build metadata matches the published version.
- If `.agent/EXECPLAN.md` exists, update its Progress section when milestones are completed.

## Testing expectations

- Run `npm test` after changes to command behavior, config, helpers, or validation.
- Run `npm run build` after changes to TypeScript entrypoints or exports.

## Safety and data handling

- Do not log or print full API keys; keep redaction behavior intact.
- Use example fixtures under `examples/` for payloads in docs/tests.

## Review guidelines

- Verify `X-N8N-API-KEY` header and base URL normalization on API calls.
- Check query string and JSON body serialization for CLI commands.
- Ensure profile overrides (`--profile`) do not mutate active profile state.
