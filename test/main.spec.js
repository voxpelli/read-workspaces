import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { readWorkspaces } from '../index.js';
import { pkgResult, workspaceAResult, workspaceZResult, pnpmPkgResult, denoPkgResult } from './fixtures/lookup.js';

/**
 * @param {import('../index.js').Options} [options]
 * @returns {Promise<Array<import('../index.js').Workspace>>}
 */
async function collect (options) {
  /** @type {Array<import('../index.js').Workspace>} */
  const data = [];

  for await (const item of readWorkspaces(options)) {
    data.push(item);
  }

  return data;
}

describe('readWorkspaces', () => {
  it('should return data', async () => {
    const data = await collect();

    assert.equal(data.length, 1);
    assert.equal(typeof data[0], 'object');
    assert.ok(data[0]);
    assert.deepEqual(Object.keys(data[0]).sort(), ['cwd', 'pkg']);
    assert.equal(data[0].pkg.name, 'read-workspaces');
  });

  it('should return data from cwd when specified', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd });

    assert.equal(data.length, 3);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should error on missing package.json file', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/missing-package-json');

    await assert.rejects(
      async () => collect({ cwd }),
      /Failed to read package\.json/
    );
  });

  it('should error on duplicate workspace names', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace-with-build-output');

    await assert.rejects(
      async () => collect({ cwd }),
      /must not have multiple workspaces with the same name/
    );
  });

  it('should ignore empty workspace filter', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, workspace: [] });

    assert.equal(data.length, 3);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should include workspaces when requested by name', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, workspace: ['@voxpelli/workspace-a'] });

    assert.equal(data.length, 2);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact absolute path', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, workspace: [`${cwd}/packages/a`] });

    assert.equal(data.length, 2);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact relative path', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, workspace: ['packages/a'] });

    assert.equal(data.length, 2);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by path prefix', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, workspace: [`${cwd}/packages`] });

    assert.equal(data.length, 3);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should throw at end of iteration if a requested workspace is missing', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    /** @type {any} */
    let referenceErr;

    try {
      for await (const item of readWorkspaces({ cwd, workspace: ['packages/a', 'packages/b'] })) {
        data.push(item);
      }
    } catch (err) {
      referenceErr = err;
    }

    assert.ok(referenceErr instanceof Error);
    assert.equal(referenceErr.message, 'Couldn\'t find all workspaces, missing: packages/b');

    assert.equal(data.length, 2);
    assert.deepEqual(data, [
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should respect "skipWorkspaces"', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, skipWorkspaces: true });

    assert.equal(data.length, 1);
    assert.deepEqual(data, [
      pkgResult(cwd),
    ]);
  });

  it('should have "skipWorkspaces" skip workspaces even when workspaces are specifically sent in', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, skipWorkspaces: true, workspace: ['@voxpelli/workspace-a'] });

    assert.equal(data.length, 1);
    assert.deepEqual(data, [
      pkgResult(cwd),
    ]);
  });

  it('should respect "includeWorkspaceRoot"', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, includeWorkspaceRoot: false });

    assert.equal(data.length, 2);
    assert.deepEqual(data, [
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should respect both "includeWorkspaceRoot" and "skipWorkspaces" at once', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace');
    const data = await collect({ cwd, includeWorkspaceRoot: false, skipWorkspaces: true });

    assert.equal(data.length, 0);
    assert.deepEqual(data, []);
  });

  it('should respect "ignorePaths"', async () => {
    const cwd = path.join(import.meta.dirname, 'fixtures/workspace-with-build-output');
    const data = await collect({ cwd, ignorePaths: ['**/build/**'] });

    assert.equal(data.length, 3);
    assert.deepEqual(data, [
      pkgResult(cwd, { workspaces: ['packages/**'] }),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  describe('pnpm', () => {
    it('should resolve pnpm workspaces', async () => {
      const cwd = path.join(import.meta.dirname, 'fixtures/pnpm-workspace');
      const data = await collect({ cwd });

      assert.equal(data.length, 3);
      assert.deepEqual(data, [
        pnpmPkgResult(cwd),
        workspaceAResult(cwd),
        workspaceZResult(cwd),
      ]);
    });
  });

  describe('deno', () => {
    it('should resolve deno workspaces', async () => {
      const cwd = path.join(import.meta.dirname, 'fixtures/deno-workspace');
      const data = await collect({ cwd });

      assert.equal(data.length, 3);
      assert.deepEqual(data, [
        denoPkgResult(cwd),
        workspaceAResult(cwd),
        workspaceZResult(cwd),
      ]);
    });
  });
});
