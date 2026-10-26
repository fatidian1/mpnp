import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';

export class UninstallConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['uninstall', 'unlink', 'remove', 'rm', 'r', 'un'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const positionals = command.getPositionals();

    // npm unlink without arguments unlinks local package (same as pnpm unlink)
    if (command.name === 'unlink' && positionals.length === 0) {
      return {
        type: 'pnpm',
        command: command
          .withPM(PackageManager.PNPM)
          .withName('unlink')
          .withParams(translateCommonFlags(command.params)),
      };
    }

    const translatedParams = translateCommonFlags(command.params);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('remove').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
