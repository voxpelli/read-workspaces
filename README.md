# read-workspaces

Resolves all `package.json` files of a workspace setup.

Supports workspace definitions from multiple package managers and runtimes:

| Package Manager / Runtime | Workspace Configuration | Detection |
|---------------------------|------------------------|-----------|
| **npm** | [`package.json` `"workspaces"`](https://docs.npmjs.com/cli/v10/using-npm/workspaces#defining-workspaces) | Direct |
| **Yarn** | `package.json` `"workspaces"` | Direct (same format as npm) |
| **Bun** | `package.json` `"workspaces"` | Direct (same format as npm) |
| **pnpm** | [`pnpm-workspace.yaml`](https://pnpm.io/pnpm-workspace_yaml) | `packageManager`, `engines.pnpm`, or `pnpm` field in root `package.json` |
| **Deno** | `deno.json` `"workspace"` | Presence of `deno.json` with a `workspace` array. Only standard JSON is supported — `deno.jsonc` files with comments are not parsed. |

All workspace members must have a `package.json` file. For Deno workspaces, the workspace structure is read from `deno.json`, but each member's `package.json` is used for the resolved package data.

Detection priority: npm/Yarn/Bun (`package.json` workspaces) > pnpm > Deno.

[![npm version](https://img.shields.io/npm/v/read-workspaces.svg?style=flat)](https://www.npmjs.com/package/read-workspaces)
[![npm downloads](https://img.shields.io/npm/dm/read-workspaces.svg?style=flat)](https://www.npmjs.com/package/read-workspaces)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-7fffff?style=flat&labelColor=ff80ff)](https://github.com/neostandard/neostandard)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://github.com/voxpelli/badges-cjs-esm)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)
[![Follow @voxpelli@mastodon.social](https://img.shields.io/mastodon/follow/109247025527949675?domain=https%3A%2F%2Fmastodon.social&style=social)](https://mastodon.social/@voxpelli)

## Usage

### Using for await

```javascript
import { readWorkspaces } from 'read-workspaces';

for await (const { cwd, pkg, workspace } = readWorkspaces()) {
  // ...
}
```

### As array

```javascript
import { readWorkspaces } from 'read-workspaces';

const workspaces = await Array.fromAsync(readWorkspaces());
```


## API

### `readWorkspaces([options])`

* **`options.cwd='.'`**: A `string` pointing to the path of the module to look up the `package.json` and installed modules for
* **`options.ignorePaths`**: An array of strings, `string[]`, with paths to ignore during the lookup of workspaces
* **`options.includeWorkspaceRoot=true`**: When set to `false` the workspace root will not be returned. Equivalent to [`npm --include-workspace-root`](https://docs.npmjs.com/cli/v10/commands/npm-run-script#include-workspace-root) but with different default.
* **`options.skipWorkspaces`**: When set to `true`, no workspace lookup will occur. Equivalent to [`npm --workspaces`](https://docs.npmjs.com/cli/v10/commands/npm-run-script#workspaces) but with different default.
* **`options.workspace`**: An array of strings, `string[]`, that should either match the name of a workspace or its path / path prefix. Narrows returned workspaces to those matching the provided strings. If a requested workspace can't be found, then an error will be thrown when the generator completes. Equivalent to npm's [`npm --workspace` / `npm -w`](https://docs.npmjs.com/cli/v10/commands/npm-run-script#workspace).

#### Returns

`AsyncGenerator` that yields the workspace root initially (unless its excluded) and then each matching workspaces

* **`cwd`**: the `string` path to the workspace / root
* **`pkg`**: the `package.json` content of the workspace / root
* **`workspace`**: the `string` name of the workspace (not set on the root)

## Used by

* [`list-installed`](https://github.com/voxpelli/list-installed)

## Similar modules

* [`read-pkg`](https://github.com/sindresorhus/read-pkg) – similar functionality but reads a single package
