import { defineConfig } from 'tsdown';

export default defineConfig([
  {
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
