import path from 'node:path';

import mapWorkspaces from '@npmcli/map-workspaces';
import { readPackage } from 'read-pkg';

/**
 * @param {string[]} filter
 * @param {string} name
 * @param {string} cwd
 * @param {string} baseCwd
 * @returns {false|string}
 */
function includeWorkspace (filter, name, cwd, baseCwd) {
  const referenceCwd = path.resolve(process.cwd(), baseCwd);

  for (const item of filter) {
    if (item === name) {
      return item;
    }

    if (cwd.startsWith(path.resolve(referenceCwd, item))) {
      return item;
    }
  }

  return false;
}

/** @typedef {import('read-pkg').NormalizedPackageJson} NormalizedPackageJson */

/**
 * @typedef Workspace
 * @property {string} cwd
 * @property {NormalizedPackageJson} pkg
 * @property {string} [workspace]
 */

/**
 * @typedef Options
 * @property {string|undefined} [cwd]
 * @property {string[]|undefined} [ignorePaths]
 * @property {boolean|undefined} [includeWorkspaceRoot]
 * @property {boolean|undefined} [skipWorkspaces]
 * @property {string[]|undefined} [workspace]
 */

/**
 * @param {Options} [options]
 * @returns {AsyncGenerator<Workspace>}
 */
export async function * readWorkspaces (options) {
  const {
    cwd: baseCwd = '.',
    ignorePaths,
    includeWorkspaceRoot = true,
    skipWorkspaces = false,
    workspace,
  } = options || {};

  const mainPkg = await readPackage({ cwd: baseCwd }).catch(
    /** @param {Error} cause */ cause => {
      throw new Error('Failed to read package.json', { cause });
    }
  );

  if (includeWorkspaceRoot) {
    yield {
      cwd: baseCwd,
      pkg: mainPkg,
    };
  }

  if (skipWorkspaces) {
    return;
  }

  const mapWorkspacesOptions = /** @satisfies {import('@npmcli/map-workspaces').Options} */ ({
    cwd: baseCwd,
    ignore: ignorePaths || [],
    pkg: mainPkg,
  });

  const workspaceList =
    mainPkg.workspaces
      ? await mapWorkspaces(mapWorkspacesOptions)
      : (
          looksLikePnpm(mainPkg)
            ? await mapPnpmWorkspaces(mapWorkspacesOptions)
            : undefined
        );

  if (!workspaceList) {
    return;
  }

  /** @type {Set<string>} */
  const matchingWorkspaces = new Set();

  for (const [name, workspaceCwd] of workspaceList) {
    const workspaceMatch = workspace?.length
      ? includeWorkspace(workspace, name, workspaceCwd, baseCwd)
      : true;

    if (!workspaceMatch) {
      continue;
    }

    if (workspaceMatch !== true) {
      matchingWorkspaces.add(workspaceMatch);
    }

    const workspacePkg = await readPackage({ cwd: workspaceCwd });

    yield {
      cwd: workspaceCwd,
      pkg: workspacePkg,
      workspace: name,
    };
  }

  if (workspace?.length && matchingWorkspaces.size !== (new Set(workspace)).size) {
    throw new Error(`Couldn't find all workspaces, missing: ${workspace.filter(value => !matchingWorkspaces.has(value)).join(', ')}`);
  }
}

/**
 * @param {NormalizedPackageJson} pkg
 * @returns {boolean}
 */
function looksLikePnpm (pkg) {
  return (
    pkg.packageManager?.startsWith('pnpm') ||
    pkg.engines?.['pnpm'] !== undefined ||
    pkg['pnpm'] !== undefined
  );
}

/**
 * @param {import('@npmcli/map-workspaces').Options} options
 * @returns {Promise<Map<string, string> | undefined>}
 */
async function mapPnpmWorkspaces ({ cwd = '.', pkg, ...options }) {
  const { readWorkspaceManifest } = await import('@pnpm/workspace.read-manifest');
  const pnpmWorkspaceManifest = await readWorkspaceManifest(cwd);

  if (!pnpmWorkspaceManifest || !pnpmWorkspaceManifest.packages) {
    return;
  }

  const modifiedPkg = /** @type {NormalizedPackageJson} */ ({
    ...pkg,
    workspaces: pnpmWorkspaceManifest.packages,
  });

  return mapWorkspaces({
    ...options,
    cwd,
    pkg: modifiedPkg,
  });
}
