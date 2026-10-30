import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('ViewConverter & SearchConverter', () => {
  const registry = ConverterRegistry.createDefault();

  describe('npm view / info / show / v', () => {
    it('translates npm info <pkg> version --no-update-notifier (blink-cmp-npm latest)', async () => {
      const cmd = parseArgs(['info', 'lodash', 'version', '--no-update-notifier']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash version');
      }
    });

    it('translates npm info <pkg> versions --json --no-update-notifier (blink-cmp-npm versions)', async () => {
      const cmd = parseArgs(['info', 'lodash', 'versions', '--json', '--no-update-notifier']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash versions --json');
      }
    });

    it('translates npm view <pkg>', async () => {
      const cmd = parseArgs(['view', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash');
      }
    });

    it('translates npm show <pkg> version', async () => {
      const cmd = parseArgs(['show', 'lodash', 'version']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash version');
      }
    });

    it('translates npm v <pkg>', async () => {
      const cmd = parseArgs(['v', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash');
      }
    });

    it('drops npm-specific flags like --no-fund, --fund, --no-audit in view', async () => {
      const cmd = parseArgs(['info', 'lodash', '--no-fund', '--no-audit']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash');
      }
    });

    it('translates workspace options in view', async () => {
      const cmd = parseArgs(['view', 'lodash', '-w', 'web']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm view lodash --filter=web');
      }
    });
  });

  describe('npm search / s / se / find', () => {
    it('translates npm search --json --no-update-notifier <pkg> (blink-cmp-npm search)', async () => {
      const cmd = parseArgs(['search', '--json', '--no-update-notifier', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm search --json lodash');
      }
    });

    it('translates npm search with --searchlimit to --search-limit', async () => {
      const cmd = parseArgs(['search', 'lodash', '--searchlimit', '10']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm search lodash --search-limit=10');
      }
    });

    it('translates npm search with --searchlimit=5 to --search-limit=5', async () => {
      const cmd = parseArgs(['search', '--searchlimit=5', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm search --search-limit=5 lodash');
      }
    });

    it('translates search aliases: s, se, find', async () => {
      for (const alias of ['s', 'se', 'find']) {
        const cmd = parseArgs([alias, 'lodash']);
        const result = await registry.convert(cmd);
        expect(result.type).toBe('pnpm');
        if (result.type === 'pnpm') {
          expect(result.command.toString()).toBe('pnpm search lodash');
        }
      }
    });

    it('drops npm search-specific flags like --no-description', async () => {
      const cmd = parseArgs(['search', 'lodash', '--no-description']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm search lodash');
      }
    });
  });

  describe('general flag cleanup', () => {
    it('drops --no-update-notifier and --update-notifier on install', async () => {
      const cmd = parseArgs(['install', 'lodash', '--no-update-notifier']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm add lodash');
      }
    });

    it('drops --no-fund, --fund, --no-audit, --audit on install', async () => {
      const cmd = parseArgs(['install', 'lodash', '--no-fund', '--no-audit']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm add lodash');
      }
    });

    it('drops -S and --save flag on install', async () => {
      const cmd1 = parseArgs(['install', 'lodash', '-S']);
      const result1 = await registry.convert(cmd1);
      expect(result1.type).toBe('pnpm');
      if (result1.type === 'pnpm') {
        expect(result1.command.toString()).toBe('pnpm add lodash');
      }

      const cmd2 = parseArgs(['install', 'lodash', '--save']);
      const result2 = await registry.convert(cmd2);
      expect(result2.type).toBe('pnpm');
      if (result2.type === 'pnpm') {
        expect(result2.command.toString()).toBe('pnpm add lodash');
      }
    });
  });
});
