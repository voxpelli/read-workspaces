import { voxpelli } from '@voxpelli/eslint-config';

export default [
  ...voxpelli({
    noMocha: true,
  }),
  {
    rules: {
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: ['import.meta.dirname'],
      }],
    },
  },
];
