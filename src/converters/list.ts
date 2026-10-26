import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class ListConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['list', 'ls', 'll', 'la'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const isLongFormat = command.name === 'll' || command.name === 'la' || command.hasFlag('long', 'l');
    let translatedParams = translateCommonFlags(command.params);

    // Translate --all / -a to --depth=Infinity in pnpm
    if (command.hasFlag('all', 'a')) {
      translatedParams = translatedParams.filter((p) => !p.matchesName('all', 'a'));
      if (!translatedParams.some((p) => p.matchesName('depth'))) {
        translatedParams.push(CommandParam.longFlag('depth', 'Infinity'));
      }
    }

    if (isLongFormat && !translatedParams.some((p) => p.matchesName('long'))) {
      translatedParams.push(CommandParam.longFlag('long'));
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('list').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
