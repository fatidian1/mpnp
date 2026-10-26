import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class ApproveBuildsConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['approve-scripts', 'deny-scripts', 'approve-builds'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const isDeny = command.name === 'deny-scripts';
    const translatedParams: CommandParam[] = [];

    for (const p of translateCommonFlags(command.params)) {
      if (p.isPositional && isDeny) {
        const deniedValue = p.raw.startsWith('!') ? p.raw : `!${p.raw}`;
        translatedParams.push(CommandParam.positional(deniedValue));
      } else {
        translatedParams.push(p);
      }
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('approve-builds').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
