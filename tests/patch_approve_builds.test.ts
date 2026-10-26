import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('Patch and ApproveBuilds Converters (npm 12+)', () => {
  const registry = ConverterRegistry.createDefault();

  describe('npm patch', () => {
    it('translates npm patch <pkg> to pnpm patch <pkg>', async () => {
      const cmd = parseArgs(['patch', 'lodash@4.17.21']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm patch lodash@4.17.21');
      }
    });

    it('translates npm patch add <pkg> to pnpm patch <pkg>', async () => {
      const cmd = parseArgs(['patch', 'add', 'express@4.18.2']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm patch express@4.18.2');
      }
    });

    it('translates npm patch commit <dir> to pnpm patch-commit <dir>', async () => {
      const cmd = parseArgs(['patch', 'commit', '/tmp/patch-1234/lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm patch-commit /tmp/patch-1234/lodash');
      }
    });

    it('translates direct npm patch-commit <dir> to pnpm patch-commit <dir>', async () => {
      const cmd = parseArgs(['patch-commit', '/tmp/patch-1234/lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm patch-commit /tmp/patch-1234/lodash');
      }
    });

    it('preserves flags like --edit-dir', async () => {
      const cmd = parseArgs(['patch', 'lodash', '--edit-dir=./custom-patch']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm patch lodash --edit-dir=./custom-patch');
      }
    });
  });

  describe('npm approve-scripts / deny-scripts', () => {
    it('translates npm approve-scripts without arguments to pnpm approve-builds', async () => {
      const cmd = parseArgs(['approve-scripts']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds');
      }
    });

    it('translates npm approve-scripts with package names', async () => {
      const cmd = parseArgs(['approve-scripts', 'esbuild', 'sharp']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds esbuild sharp');
      }
    });

    it('translates npm deny-scripts <pkg> to pnpm approve-builds !<pkg>', async () => {
      const cmd = parseArgs(['deny-scripts', 'malicious-pkg']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds !malicious-pkg');
      }
    });

    it('translates npm approve-scripts with --all flag', async () => {
      const cmd = parseArgs(['approve-scripts', '--all']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds --all');
      }
    });
  });
});
