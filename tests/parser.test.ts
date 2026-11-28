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

  it('parses flags with argument values like package, sbom-type, diff-unified', () => {
    const cmdExec = parseArgs(['exec', '--package', 'cowsay', 'cowsay', 'hello']);
    expect(cmdExec.getFlagValue('package')).toBe('cowsay');
    expect(cmdExec.getPositionals()).toEqual(['cowsay', 'hello']);

    const cmdShort = parseArgs(['exec', '-p', 'cowsay', 'cowsay']);
    expect(cmdShort.getFlagValue('p')).toBe('cowsay');
    expect(cmdShort.getPositionals()).toEqual(['cowsay']);

    const cmdSbom = parseArgs(['sbom', '--sbom-type', 'cyclonedx']);
    expect(cmdSbom.getFlagValue('sbom-type')).toBe('cyclonedx');

    const cmdDiff = parseArgs(['diff', '--diff-unified', '5']);
    expect(cmdDiff.getFlagValue('diff-unified')).toBe('5');

    const cmdEdit = parseArgs(['edit', 'lodash', '--editor', 'nvim']);
    expect(cmdEdit.getFlagValue('editor')).toBe('nvim');
    expect(cmdEdit.getPositionals()).toEqual(['lodash']);

    const cmdPublish = parseArgs(['publish', '--otp', '123456', '--access', 'public', '--new-version', '1.2.3']);
    expect(cmdPublish.getFlagValue('otp')).toBe('123456');
    expect(cmdPublish.getFlagValue('access')).toBe('public');
    expect(cmdPublish.getFlagValue('new-version')).toBe('1.2.3');
    expect(cmdPublish.getPositionals()).toEqual([]);

    const cmdAge = parseArgs(['install', '--minimum-release-age', '1440', '--minimum-release-age-exclude', 'lodash']);
    expect(cmdAge.getFlagValue('minimum-release-age')).toBe('1440');
    expect(cmdAge.getFlagValue('minimum-release-age-exclude')).toBe('lodash');

    const cmdFindBy = parseArgs(['why', 'react', '--find-by', 'myFinder']);
    expect(cmdFindBy.getFlagValue('find-by')).toBe('myFinder');
    expect(cmdFindBy.getPositionals()).toEqual(['react']);
  });
});
