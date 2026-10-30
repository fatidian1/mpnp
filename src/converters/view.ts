import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class ViewConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['view', 'info', 'show', 'v'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('view').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
