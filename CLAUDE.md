# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ESM library that resolves all `package.json` files in a workspace setup. Supports npm/Yarn/Bun, pnpm, and Deno workspace definitions. Detection priority: npm/Yarn/Bun > pnpm > Deno.

Node engine requirements: `^22.22.2 || ^24.15.0 || >=26.0.0`.

## Commands

- `npm test` — Full check suite + tests (runs `check` then `test:*`)
- `npm run test-ci` — Tests only with c8 coverage
- `npm run check` — Linting, type-checking, knip, type-coverage, then type tests
- `npm run check:tsc` — TypeScript type-checking only
- `npm run check:lint` — ESLint only
- `npm run check-type-tests` — tstyche type tests (requires network for TypeScript fetching)
- `npm run build` — Generate TypeScript declarations (`index.d.ts`)
- Run single test: `node --test test/main.spec.js`

## Architecture

Single-file library (`index.js`) exporting one async generator function `readWorkspaces(options?)` that yields `{ cwd, pkg, workspace? }` objects.

Options: `cwd` (default `'.'`), `ignorePaths` (glob patterns to skip), `includeWorkspaceRoot` (default `true`), `skipWorkspaces` (default `false`), `workspace` (filter by name or path).

Workspace detection works by:

1. Reading root `package.json` via `read-pkg`
2. If `workspaces` field exists → npm/yarn/bun path via `@npmcli/map-workspaces`
3. Else if pnpm indicators found (`packageManager` starts with `pnpm`, `engines.pnpm` exists, or `pnpm` field exists) → reads `pnpm-workspace.yaml` via `@pnpm/workspace.read-manifest`, converts to npm format
4. Else → tries `deno.json`/`deno.jsonc` for Deno workspace array, converts to npm format

Tests in `test/main.spec.js` using `node:test` + `node:assert/strict`. Test fixtures in `test/fixtures/` for each workspace type. `test/fixtures/lookup.js` is a shared test helper (not a test file).

Type tests in `typetests/main.tst.ts` using tstyche.

## Conventions

- **Pure JavaScript with JSDoc types** — no `.ts` source files, types via JSDoc annotations
- **99%+ type-coverage** enforced via `type-coverage` CLI
- **Conventional commits** required (validated by husky hooks)
- **`node:` prefix** for all Node.js built-in imports
- **ESM only** — `"type": "module"` in package.json
- Follows [voxpelli/node-module-template](https://github.com/voxpelli/node-module-template) patterns for tooling and script structure