import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { join } from 'desm';

import { readWorkspaces } from '../index.js';
import { pkgResult, workspaceAResult, workspaceZResult, pnpmPkgResult } from './fixtures/lookup.js';

chai.use(chaiAsPromised);

const should = chai.should();

describe('readWorkspaces', () => {
  it('should return data', async () => {
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces()) {
      data.push(item);
    }

    data.should.have.length(1);

    for (const item of data) {
      item.should.be.an('object')
        .with.keys('cwd', 'pkg')
        .and.have.nested.property('pkg.name', 'read-workspaces');
    }
  });

  it('should return data from cwd when specified', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd })) {
      data.push(item);
    }

    data.should.have.length(3).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should error on missing package.json file', async () => {
    const cwd = join(import.meta.url, 'fixtures/missing-package-json');

    await Promise.resolve().then(async () => {
      /** @type {Array<import('../index.js').Workspace>} */
      const data = [];

      for await (const item of readWorkspaces({ cwd })) {
        data.push(item);
      }

      return data;
    })
      .should.be.rejectedWith(/Failed to read package\.json/);
  });

  it('should error on duplicate workspace names', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace-with-build-output');
    await Promise.resolve().then(async () => {
      /** @type {Array<import('../index.js').Workspace>} */
      const data = [];

      for await (const item of readWorkspaces({ cwd })) {
        data.push(item);
      }

      return data;
    })
      .should.be.rejectedWith(/must not have multiple workspaces with the same name/);
  });

  it('should ignore empty workspace filter', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, workspace: [] })) {
      data.push(item);
    }

    data.should.have.length(3).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should include workspaces when requested by name', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, workspace: ['@voxpelli/workspace-a'] })) {
      data.push(item);
    }

    data.should.have.length(2).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact absolute path', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, workspace: [`${cwd}/packages/a`] })) {
      data.push(item);
    }

    data.should.have.length(2).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by exact relative path', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, workspace: ['packages/a'] })) {
      data.push(item);
    }

    data.should.have.length(2).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should include workspaces when requested by path prefix', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, workspace: [`${cwd}/packages`] })) {
      data.push(item);
    }

    data.should.have.length(3).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should throw at end of iteration if a requested workspace is missing', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
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

    should.exist(referenceErr);

    referenceErr.should.be.an('error').with.property('message', 'Couldn\'t find all workspaces, missing: packages/b');

    data.should.have.length(2).and.deep.equal([
      pkgResult(cwd),
      workspaceAResult(cwd),
    ]);
  });

  it('should respect "skipWorkspaces"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, skipWorkspaces: true })) {
      data.push(item);
    }

    data.should.have.length(1).and.deep.equal([
      pkgResult(cwd),
    ]);
  });

  it('should have "skipWorkspaces" skip workspaces even when workspaces are specifically sent in', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, skipWorkspaces: true, workspace: ['@voxpelli/workspace-a'] })) {
      data.push(item);
    }

    data.should.have.length(1).and.deep.equal([
      pkgResult(cwd),
    ]);
  });

  it('should respect "includeWorkspaceRoot"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, includeWorkspaceRoot: false })) {
      data.push(item);
    }

    data.should.have.length(2).and.deep.equal([
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  it('should respect both "includeWorkspaceRoot" and "skipWorkspaces" at once', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, includeWorkspaceRoot: false, skipWorkspaces: true })) {
      data.push(item);
    }

    data.should.have.length(0).and.deep.equal([]);
  });

  it('should respect "ignorePaths"', async () => {
    const cwd = join(import.meta.url, 'fixtures/workspace-with-build-output');
    /** @type {Array<import('../index.js').Workspace>} */
    const data = [];

    for await (const item of readWorkspaces({ cwd, ignorePaths: ['**/build/**'] })) {
      data.push(item);
    }

    data.should.have.length(3).and.deep.equal([
      pkgResult(cwd, { workspaces: ['packages/**'] }),
      workspaceAResult(cwd),
      workspaceZResult(cwd),
    ]);
  });

  describe('pnpm', () => {
    it('should resolve pnpm workspaces', async () => {
      const cwd = join(import.meta.url, 'fixtures/pnpm-workspace');
      /** @type {Array<import('../index.js').Workspace>} */
      const data = [];

      for await (const item of readWorkspaces({ cwd })) {
        data.push(item);
      }

      data.should.have.length(3).and.deep.equal([
        pnpmPkgResult(cwd),
        workspaceAResult(cwd),
        workspaceZResult(cwd),
      ]);
    });
  });
});
