import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class SearchConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['search', 's', 'se', 'find'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('search').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
