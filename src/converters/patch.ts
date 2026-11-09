import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export function handlePatch(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const isDirectPatchCommit = command.name === 'patch-commit';
  const positionals = command.getPositionals();

  if (isDirectPatchCommit) {
    const translatedParams = translate(command);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('patch-commit').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  // Subcommand: npm patch commit <dir> -> pnpm patch-commit <dir>
  if (positionals.length > 0 && positionals[0] === 'commit') {
    const filteredParams: CommandParam[] = [];
    let skippedFirst = false;

    for (const p of command.params) {
      if (!skippedFirst && p.isPositional && p.raw === 'commit') {
        skippedFirst = true;
        continue;
      }
      filteredParams.push(p);
    }

    const pnpmCommand = command
      .withPM(PackageManager.PNPM)
      .withName('patch-commit')
      .withParams(translate(command.withParams(filteredParams)));

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  // Subcommand: npm patch add <pkg> -> pnpm patch <pkg>
  if (positionals.length > 0 && positionals[0] === 'add') {
    const filteredParams: CommandParam[] = [];
    let skippedFirst = false;

    for (const p of command.params) {
      if (!skippedFirst && p.isPositional && p.raw === 'add') {
        skippedFirst = true;
        continue;
      }
      filteredParams.push(p);
    }

    const pnpmCommand = command
      .withPM(PackageManager.PNPM)
      .withName('patch')
      .withParams(translate(command.withParams(filteredParams)));

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  // Standard: npm patch <pkg> -> pnpm patch <pkg>
  const translatedParams = translate(command);
  const pnpmCommand = command.withPM(PackageManager.PNPM).withName('patch').withParams(translatedParams);

  return {
    type: 'pnpm',
    command: pnpmCommand,
  };
}
