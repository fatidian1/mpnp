import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class ExecConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['exec'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('exec').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
