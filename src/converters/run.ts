import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class RunConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['run', 'run-script', 'test', 't', 'tst', 'start', 'stop', 'restart'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    let targetName = command.name;

    if (targetName === 'run-script') {
      targetName = 'run';
    } else if (targetName === 't' || targetName === 'tst') {
      targetName = 'test';
    }

    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName(targetName).withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
