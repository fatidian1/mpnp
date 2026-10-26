import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';
import { parsePackageSpec } from '../src/utils/tarball.js';
import { isLocalPath } from '../src/converters/pack.js';

describe('PackConverter and Tarball Utilities', () => {
  const registry = ConverterRegistry.createDefault();

  describe('parsePackageSpec', () => {
    it('parses standard packages without version', () => {
      const res = parsePackageSpec('lodash');
      expect(res.name).toBe('lodash');
      expect(res.versionSpec).toBe('latest');
    });

    it('parses standard packages with version or range', () => {
      const res = parsePackageSpec('lodash@4.17.21');
      expect(res.name).toBe('lodash');
      expect(res.versionSpec).toBe('4.17.21');
    });

    it('parses scoped packages without version', () => {
      const res = parsePackageSpec('@types/node');
      expect(res.name).toBe('@types/node');
      expect(res.versionSpec).toBe('latest');
    });

    it('parses scoped packages with version', () => {
      const res = parsePackageSpec('@types/node@22.0.0');
      expect(res.name).toBe('@types/node');
      expect(res.versionSpec).toBe('22.0.0');
    });
  });

  describe('isLocalPath', () => {
    it('identifies relative and absolute paths', () => {
      expect(isLocalPath('./subpkg', process.cwd())).toBe(true);
      expect(isLocalPath('../subpkg', process.cwd())).toBe(true);
      expect(isLocalPath('/tmp', process.cwd())).toBe(true);
      expect(isLocalPath('~/project', process.cwd())).toBe(true);
    });

    it('identifies remote package names', () => {
      expect(isLocalPath('lodash', process.cwd())).toBe(false);
      expect(isLocalPath('@types/node', process.cwd())).toBe(false);
      expect(isLocalPath('react@18.2.0', process.cwd())).toBe(false);
    });
  });

  describe('Pack command conversion', () => {
    it('delegates local npm pack (no args) to pnpm pack', async () => {
      const cmd = parseArgs(['pack']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm pack');
      }
    });

    it('delegates local path npm pack to pnpm pack with destination', async () => {
      const cmd = parseArgs(['pack', './packages/core', '--pack-destination', './dist']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm pack ./packages/core --pack-destination=./dist');
      }
    });

    it('intercepts remote package name (e.g. npm pack lodash) and uses custom handler', async () => {
      const cmd = parseArgs(['pack', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      if (result.type === 'custom') {
        expect(result.description).toContain('Download remote tarball(s) for lodash');
      }
    });
  });
});
