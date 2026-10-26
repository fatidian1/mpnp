import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class CacheConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['cache'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const positionals = command.getPositionals();
    const subAction = positionals[0];

    const remainingParams = command.params.filter((p) => !(p.isPositional && p.raw === subAction));
    const translatedParams = translateCommonFlags(remainingParams);

    if (subAction === 'clean') {
      const pnpmCommand = command
        .withPM(PackageManager.PNPM)
        .withName('store')
        .withParams([CommandParam.positional('prune'), ...translatedParams]);

      return {
        type: 'pnpm',
        command: pnpmCommand,
      };
    }

    // cache ls, cache verify, etc.
    const pnpmCommand = command
      .withPM(PackageManager.PNPM)
      .withName('store')
      .withParams([CommandParam.positional('status'), ...translatedParams]);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
