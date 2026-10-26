import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import type { CommandParam } from '../core/param.js';

export class PatchConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['patch', 'patch-commit'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const isDirectPatchCommit = command.name === 'patch-commit';
    const positionals = command.getPositionals();

    if (isDirectPatchCommit) {
      const translatedParams = translateCommonFlags(command.params);
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
        .withParams(translateCommonFlags(filteredParams));

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
        .withParams(translateCommonFlags(filteredParams));

      return {
        type: 'pnpm',
        command: pnpmCommand,
      };
    }

    // Standard npm patch <pkg> -> pnpm patch <pkg>
    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('patch').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
