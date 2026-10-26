import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';

describe('Outdated, Audit, Prune, Dedupe, List', () => {
  const registry = ConverterRegistry.createDefault();

  it('translates npm outdated', async () => {
    const cmd = parseArgs(['outdated', '--long', '-g']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm outdated --long -g');
    }
  });

  it('translates npm audit without args', async () => {
    const cmd = parseArgs(['audit', '--json']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm audit --json');
    }
  });

  it('translates npm audit fix to pnpm audit --fix', async () => {
    const cmd = parseArgs(['audit', 'fix']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm audit --fix');
    }
  });

  it('translates npm prune --production to pnpm prune --prod', async () => {
    const cmd = parseArgs(['prune', '--production']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm prune --prod');
    }
  });

  it('translates npm dedupe to pnpm dedupe', async () => {
    const cmd = parseArgs(['dedupe', '--check']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm dedupe --check');
    }
  });

  it('translates npm find-dupes alias to pnpm dedupe', async () => {
    const cmd = parseArgs(['find-dupes']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm dedupe');
    }
  });

  it('translates npm ls --all to pnpm list --depth Infinity', async () => {
    const cmd = parseArgs(['ls', '--all']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm list --depth=Infinity');
    }
  });

  it('translates npm ll to pnpm list --long', async () => {
    const cmd = parseArgs(['ll']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm list --long');
    }
  });

  it('translates npm explain to pnpm why', async () => {
    const cmd = parseArgs(['explain', 'lodash']);
    const result = await registry.convert(cmd);
    expect(result.type).toBe('pnpm');
    if (result.type === 'pnpm') {
      expect(result.command.toString()).toBe('pnpm why lodash');
    }
  });
});
