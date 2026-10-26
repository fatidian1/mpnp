import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    npm: 'src/cli/npm.ts',
    npx: 'src/cli/npx.ts',
  },
  format: 'esm',
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
  banner: (chunk) => {
    // chunk is a RenderedChunk object with fileName / name
    if (chunk && chunk.fileName && !chunk.fileName.includes('index') && !chunk.fileName.includes('executor')) {
      return '#!/usr/bin/env node\n';
    }
    return '';
  },
});
