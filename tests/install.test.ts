import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('InstallConverter', () => {
  const registry = ConverterRegistry.createDefault();

  it('translates npm install (no args) to pnpm install', async () => {
    const cmd = parseArgs(['install']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm install');
    }
  });

  it('translates npm i to pnpm install', async () => {
    const cmd = parseArgs(['i']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm install');
    }
  });

  it('translates npm install <pkg> to pnpm add <pkg>', async () => {
    const cmd = parseArgs(['install', 'lodash']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm add lodash');
    }
  });

  it('translates multiple packages and dev flag', async () => {
    const cmd = parseArgs(['i', 'lodash', 'axios', '--save-dev']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm add lodash axios -D');
    }
  });

  it('translates short dev flag -D and exact flag -E', async () => {
    const cmd = parseArgs(['i', 'lodash', '-D', '--save-exact']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm add lodash -D -E');
    }
  });

  it('translates optional flag', async () => {
    const cmd = parseArgs(['install', 'canvas', '--save-optional']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm add canvas -O');
    }
  });

  it('translates workspace options -w and -ws', async () => {
    const singleWs = parseArgs(['i', 'lodash', '-w', 'frontend']);
    const resultSingle = await registry.convert(singleWs);
    expect(resultSingle.type).toBe('pnpm');
    if (resultSingle.type === 'pnpm') {
      expect(resultSingle.command.toString()).toBe('pnpm add lodash --filter=frontend');
    }

    const multiWs = parseArgs(['install', '-ws']);
    const resultMulti = await registry.convert(multiWs);
    expect(resultMulti.type).toBe('pnpm');
    if (resultMulti.type === 'pnpm') {
      expect(resultMulti.command.toString()).toBe('pnpm install -r');
    }
  });

  it('translates --package-lock-only to --lockfile-only', async () => {
    const cmd = parseArgs(['install', '--package-lock-only']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm install --lockfile-only');
    }
  });

  it('translates --legacy-peer-deps to --no-strict-peer-dependencies', async () => {
    const cmd = parseArgs(['install', 'react', '--legacy-peer-deps']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm add react --no-strict-peer-dependencies');
    }
  });

  it('translates --omit=dev and --production to --prod', async () => {
    const cmd1 = parseArgs(['install', '--omit=dev']);
    const result1 = await registry.convert(cmd1);
    expect(result1.type).toBe('pnpm');
    if (result1.type === 'pnpm') {
      expect(result1.command.toString()).toBe('pnpm install --prod');
    }

    const cmd2 = parseArgs(['install', '--production']);
    const result2 = await registry.convert(cmd2);
    expect(result2.type).toBe('pnpm');
    if (result2.type === 'pnpm') {
      expect(result2.command.toString()).toBe('pnpm install --prod');
    }
  });

  it('translates npm --cache <dir> to pnpm --cache-dir', async () => {
    const cmd = parseArgs(['install', '--cache', '/tmp/custom-cache']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm install --cache-dir=/tmp/custom-cache');
    }
  });

  it('preserves --env-file with value', async () => {
    const cmd = parseArgs(['install', '--env-file', '.env.local']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm install --env-file=.env.local');
    }
  });
});
