import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class LinkConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['link'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const positionals = command.getPositionals();
    let translatedParams = translateCommonFlags(command.params);

    // npm link without arguments creates global link -> pnpm link --global
    if (positionals.length === 0 && !command.hasFlag('global', 'g')) {
      translatedParams = [...translatedParams, CommandParam.longFlag('global')];
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('link').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
