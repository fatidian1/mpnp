import { defineConfig, type DepsConfig } from 'tsdown';
const deps: DepsConfig = {
  neverBundle: ['@pnpm/napi'],
};
export default defineConfig([
  {
    deps,
    entry: {
      index: 'src/index.ts',
    },
    format: 'esm',
    target: 'node20',
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    deps,
    entry: {
      npm: 'src/cli/npm.ts',
    },
    format: 'esm',
    target: 'node20',
    dts: false,
    clean: false,
    banner: '#!/usr/bin/env node\n',
  },
  {
    deps,
    entry: {
      npx: 'src/cli/npx.ts',
    },
    format: 'esm',
    target: 'node20',
    dts: false,
    clean: false,
    banner: '#!/usr/bin/env node\n',
  },
]);
