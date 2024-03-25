import path from 'node:path';

/**
 * @param {string} moduleName
 * @returns {string}
 */
function platformSpecificPath (moduleName) {
  return moduleName.replaceAll('/', path.sep);
}

export const pkgResult = (/** @type {string} */ cwd) => ({
  cwd,
  pkg: {
    _id: '@',
    engines: { node: '>=8.0.0' },
    dependencies: {
      bar: '^1.0.0',
      foo: '^1.0.0',
    },
    name: '',
    readme: 'ERROR: No README data found!',
    version: '',
    workspaces: ['packages/*'],
  },
});

export const workspaceAResult = (/** @type {string} */ cwd) => ({
  cwd: cwd + platformSpecificPath('/packages/a'),
  pkg: {
    _id: '@voxpelli/workspace-a@',
    engines: { node: '>=8.0.0' },
    dependencies: {
      abc: '^1.0.0',
      bar: '^2.0.0',
      foo: '^1.0.0',
    },
    name: '@voxpelli/workspace-a',
    'private': true,
    readme: 'ERROR: No README data found!',
    version: '',
  },
  workspace: '@voxpelli/workspace-a',
});

export const workspaceZResult = (/** @type {string} */ cwd) => ({
  cwd: cwd + platformSpecificPath('/packages/z'),
  pkg: {
    _id: '@voxpelli/workspace-z@',
    engines: { node: '>=8.0.0' },
    name: '@voxpelli/workspace-z',
    'private': true,
    readme: 'ERROR: No README data found!',
    version: '',
  },
  workspace: '@voxpelli/workspace-z',
});
