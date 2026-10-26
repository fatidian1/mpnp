import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('Init, Pkg, Link, Run, Cache Converters', () => {
  const registry = ConverterRegistry.createDefault();

  describe('npm init', () => {
    it('translates npm init without args to pnpm init', async () => {
      const cmd = parseArgs(['init']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm init');
      }
    });

    it('translates npm init with initializer to pnpm create', async () => {
      const cmd = parseArgs(['init', '@vitejs/app', 'my-app']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm create @vitejs/app my-app');
      }
    });

    it('attaches postAction when --scope is provided', async () => {
      const cmd = parseArgs(['init', '--scope=myorg']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm init');
        expect(result.postActions).toBeDefined();
        expect(result.postActions?.[0].description).toBe('Set package.json scope to @myorg');
      }
    });
  });

  describe('npm pkg', () => {
    it('translates npm pkg get and set', async () => {
      const getCmd = parseArgs(['pkg', 'get', 'scripts.build']);
      const getResult = await registry.convert(getCmd);
      expect(getResult.type).toBe('pnpm');
      if (getResult.type === 'pnpm') {
        expect(getResult.command.toString()).toBe('pnpm pkg get scripts.build');
      }

      const setCmd = parseArgs(['pkg', 'set', 'name=foo']);
      const setResult = await registry.convert(setCmd);
      expect(setResult.type).toBe('pnpm');
      if (setResult.type === 'pnpm') {
        expect(setResult.command.toString()).toBe('pnpm pkg set name=foo');
      }
    });
  });

  describe('npm link', () => {
    it('translates npm link (no args) to pnpm link --global', async () => {
      const cmd = parseArgs(['link']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm link --global');
      }
    });

    it('translates npm link <pkg> to pnpm link <pkg>', async () => {
      const cmd = parseArgs(['link', 'my-package']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm link my-package');
      }
    });
  });

  describe('npm run & lifecycle', () => {
    it('translates npm run build', async () => {
      const cmd = parseArgs(['run', 'build']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm run build');
      }
    });

    it('translates npm test and npm t to pnpm test', async () => {
      const testCmd = parseArgs(['test']);
      const testRes = await registry.convert(testCmd);
      if (testRes.type === 'pnpm') {
        expect(testRes.command.toString()).toBe('pnpm test');
      }

      const tCmd = parseArgs(['t']);
      const tRes = await registry.convert(tCmd);
      if (tRes.type === 'pnpm') {
        expect(tRes.command.toString()).toBe('pnpm test');
      }
    });

    it('translates npm start, stop, restart', async () => {
      const startCmd = parseArgs(['start']);
      const startRes = await registry.convert(startCmd);
      if (startRes.type === 'pnpm') {
        expect(startRes.command.toString()).toBe('pnpm start');
      }
    });
  });

  describe('npm cache', () => {
    it('translates npm cache clean to pnpm store prune', async () => {
      const cmd = parseArgs(['cache', 'clean']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm store prune');
      }
    });

    it('translates npm cache ls to pnpm store status', async () => {
      const cmd = parseArgs(['cache', 'ls']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm store status');
      }
    });
  });
});
