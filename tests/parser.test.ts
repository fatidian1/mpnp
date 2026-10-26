import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { PackageManager, ParamKind } from '../src/types/index.js';

describe('parseArgs', () => {
  it('parses empty args', () => {
    const cmd = parseArgs([], PackageManager.NPM);
    expect(cmd.name).toBe('');
    expect(cmd.params).toHaveLength(0);
    expect(cmd.pm).toBe(PackageManager.NPM);
  });

  it('parses basic command and positional arguments', () => {
    const cmd = parseArgs(['install', 'lodash', 'axios']);
    expect(cmd.name).toBe('install');
    expect(cmd.getPositionals()).toEqual(['lodash', 'axios']);
  });

  it('parses short and long flags', () => {
    const cmd = parseArgs(['i', 'lodash', '-D', '--save-exact']);
    expect(cmd.name).toBe('i');
    expect(cmd.hasFlag('D')).toBe(true);
    expect(cmd.hasFlag('save-exact')).toBe(true);
  });

  it('parses flag with = value', () => {
    const cmd = parseArgs(['install', '--workspace=backend', '--prefix=/opt/app']);
    expect(cmd.getFlagValue('workspace')).toBe('backend');
    expect(cmd.getFlagValue('prefix')).toBe('/opt/app');
  });

  it('parses flag with space-separated value', () => {
    const cmd = parseArgs(['install', '-w', 'frontend', '--prefix', '/opt/app']);
    expect(cmd.getFlagValue('w')).toBe('frontend');
    expect(cmd.getFlagValue('prefix')).toBe('/opt/app');
  });

  it('handles -- delimiter as end of flags', () => {
    const cmd = parseArgs(['run', 'build', '--', '--mode', 'production', '-v']);
    expect(cmd.name).toBe('run');
    expect(cmd.getPositionals()).toEqual(['build', '--mode', 'production', '-v']);
    expect(cmd.params.some((p) => p.kind === ParamKind.EndOfFlags)).toBe(true);
  });
});
