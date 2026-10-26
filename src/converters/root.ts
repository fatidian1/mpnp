import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class RootConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['root', 'prefix', 'bin'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    let targetName = command.name;
    if (targetName === 'prefix') {
      targetName = 'root';
    }

    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName(targetName).withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
