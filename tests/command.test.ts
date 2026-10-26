import { describe, it, expect } from 'vitest';
import { Command } from '../src/core/command.js';
import { CommandParam } from '../src/core/param.js';
import { PackageManager } from '../src/types/index.js';

describe('Command', () => {
  it('supports query and transformation methods', () => {
    const cmd = new Command({
      pm: PackageManager.NPM,
      name: 'install',
      params: [
        CommandParam.positional('lodash'),
        CommandParam.shortFlag('D'),
        CommandParam.longFlag('workspace', 'web'),
      ],
    });

    expect(cmd.hasFlag('D')).toBe(true);
    expect(cmd.hasFlag('save-dev')).toBe(false);
    expect(cmd.getFlagValue('workspace')).toBe('web');
    expect(cmd.getPositionals()).toEqual(['lodash']);

    const modified = cmd
      .withName('add')
      .withPM(PackageManager.PNPM)
      .withoutFlags('workspace')
      .addLongFlag('filter', 'web');

    expect(modified.pm).toBe(PackageManager.PNPM);
    expect(modified.name).toBe('add');
    expect(modified.hasFlag('workspace')).toBe(false);
    expect(modified.getFlagValue('filter')).toBe('web');
    expect(modified.toArgs()).toEqual(['add', 'lodash', '-D', '--filter=web']);
    expect(modified.toString()).toBe('pnpm add lodash -D --filter=web');
  });
});
