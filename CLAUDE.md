# read-workspaces

ESM library that resolves all `package.json` files in a workspace setup. Supports npm/yarn, pnpm, and Deno workspace definitions.

## Commands

- `npm test` — Run linting + tests (full check)
- `npm run test-ci` — Run tests only
- `npm run check` — Run linting/type-checking only
- `npm run build` — Generate TypeScript declarations

## Architecture

- Single entry point: `index.js` — async generator yielding workspace objects
- Tests: `test/main.spec.js` using `node:test` + `node:assert/strict`
- Test fixtures in `test/fixtures/` (workspace, pnpm-workspace, deno-workspace, etc.)

## Conventions

- **Pure JavaScript with JSDoc types** — no `.ts` source files, types via JSDoc annotations
- **99%+ type-coverage** enforced via `type-coverage` CLI
- **Conventional commits** required (validated by hooks)
- **`node:` prefix** for all Node.js built-in imports
- **ESM only** — `"type": "module"` in package.json

## Dependencies

- `@npmcli/map-workspaces` — maps npm/yarn workspace glob patterns to resolved package directories
- `@pnpm/workspace.read-manifest` — reads `pnpm-workspace.yaml` manifest files
- `read-pkg` — reads and normalizes `package.json` files
