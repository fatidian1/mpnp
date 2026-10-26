import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class CiConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['ci', 'clean-install', 'ic'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const translatedParams = translateCommonFlags(command.params);

    if (!translatedParams.some((p) => p.matchesName('frozen-lockfile'))) {
      translatedParams.push(CommandParam.longFlag('frozen-lockfile'));
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('install').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
