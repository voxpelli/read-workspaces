import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { join } from 'desm';

import { readWorkspaces } from '../index.js';
import {
  pkgResult, pnpmPkgResult, workspaceAResult, workspaceZResult,
} from './fixtures/lookup.js';

/**
 * @param {import('../index.js').Options} [options]
 * @returns {Promise<Array<import('../index.js').Workspace>>}
 */
async function collectWorkspaces (options) {
  /** @type {Array<import('../index.js').Workspace>} */
  const data = [];

  for await (const item of readWorkspaces(options)) {
    data.push(item);
  }

  return data;
}

describe('readWorkspaces', () => {
  it('should return data', async () => {
    const data = await collectWorkspaces();

    assert.strictEqual(data.length, 1);

    for (const item of data) {
      assert.deepStrictEqual(Object.keys(item).toSorted(), ['cwd', 'pkg']);
      assert.strictEqual(item.pkg.name, 'read-workspaces');
    }
  });

  it('should return data from cwd when specified', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should error on missing package.json file', async () => {
    const cwd = join(import.meta.url, 'fixtures/missing-package-json');

    await assert.rejects(
      () => collectWorkspaces({ cwd }),
      /Failed to read package\.json/
    );
  });

  it('should error on duplicate workspace names', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace-with-build-output');

    await assert.rejects(
      () => collectWorkspaces({ cwd }),
      /must not have multiple workspaces with the same name/
    );
  });

  it('should ignore empty workspace filter', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, workspace: [] }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should include workspaces when requested by name', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, workspace: ['@voxpelli/workspace-a'] }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact absolute path', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, workspace: [`${cwd}/packages/a`] }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact relative path', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, workspace: ['packages/a'] }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by path prefix', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, workspace: [`${cwd}/packages`] }), [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should throw at end of iteration if a requested workspace is missing', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    await assert.rejects(
      async () => {
        for await (const item of readWorkspaces({ cwd, workspace: ['packages/a', 'packages/b'] })) {
          data.push(item);
        }
      },
      /**
       * @param {unknown} err
       * @returns {boolean}
       */
      err => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'Couldn\'t find all workspaces, missing: packages/b');
        return true;
      }
    );

    assert.deepStrictEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should respect "skipWorkspaces"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, skipWorkspaces: true }), [
      pkgResult(cwd),
    ]);
  });

  it('should have "skipWorkspaces" skip workspaces even when workspaces are specifically sent in', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, skipWorkspaces: true, workspace: ['@voxpelli/workspace-a'] }), [
      pkgResult(cwd),
    ]);
  });

  it('should respect "includeWorkspaceRoot"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, includeWorkspaceRoot: false }), [
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should respect both "includeWorkspaceRoot" and "skipWorkspaces" at once', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, includeWorkspaceRoot: false, skipWorkspaces: true }), []);
  });

  it('should respect "ignorePaths"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace-with-build-output');

    assert.deepStrictEqual(await collectWorkspaces({ cwd, ignorePaths: ['**/build/**'] }), [
      pkgResult(cwd, { workspaces: ['packages/**'] }),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  describe('pnpm', () => {
    it('should resolve pnpm workspaces', async () => {
      const cwd = join(import.meta.url, 'fixtures/pnpm-workspace');

      assert.deepStrictEqual(await collectWorkspaces({ cwd }), [
        pnpmPkgResult(cwd),
        workspaceAResult(cwd),
        workspaceZResult(cwd),
      ]);
    });
  });
});
