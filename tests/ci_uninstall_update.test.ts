import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('Ci, Uninstall, Update Converters', () => {
  const registry = ConverterRegistry.createDefault();

  describe('npm ci', () => {
    it('translates npm ci to pnpm install --frozen-lockfile', async () => {
      const cmd = parseArgs(['ci']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm install --frozen-lockfile');
      }
    });

    it('translates npm ci with --omit=dev and -w', async () => {
      const cmd = parseArgs(['ci', '--omit=dev', '-w', 'api']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm install --prod --filter=api --frozen-lockfile');
      }
    });
  });

  describe('npm uninstall', () => {
    it('translates npm uninstall to pnpm remove', async () => {
      const cmd = parseArgs(['uninstall', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm remove lodash');
      }
    });

    it('translates npm rm with -D flag', async () => {
      const cmd = parseArgs(['rm', 'jest', '-D']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm remove jest -D');
      }
    });

    it('translates npm unlink without args to pnpm unlink', async () => {
      const cmd = parseArgs(['unlink']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm unlink');
      }
    });
  });

  describe('npm update', () => {
    it('translates npm update to pnpm update', async () => {
      const cmd = parseArgs(['update']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm update');
      }
    });

    it('translates npm up with package and workspace filter', async () => {
      const cmd = parseArgs(['up', 'lodash', '-w', 'web']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm update lodash --filter=web');
      }
    });
  });
});
