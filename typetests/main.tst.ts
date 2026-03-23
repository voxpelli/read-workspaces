import { describe, expect, it } from 'tstyche';

import { readWorkspaces } from '../index.js';

describe('readWorkspaces', () => {
  it('should accept no options', () => {
    expect(readWorkspaces()).type.not.toRaiseError();
  });

  it('should accept options with cwd', () => {
    expect(readWorkspaces({ cwd: '.' })).type.not.toRaiseError();
  });

  it('should accept options with all properties', () => {
    expect(readWorkspaces({
      cwd: '.',
      ignorePaths: ['node_modules'],
      includeWorkspaceRoot: true,
      skipWorkspaces: false,
      workspace: ['foo'],
    })).type.not.toRaiseError();
  });

  it('should reject invalid options', () => {
    expect(readWorkspaces({ cwd: 123 })).type.toRaiseError();
  });

  it('should return an async generator', () => {
    expect(readWorkspaces()).type.toBeAssignableTo<AsyncGenerator<{ cwd: string; pkg: object }>>();
  });
});
