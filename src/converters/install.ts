import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class InstallConverter implements CommandConverter {
  readonly commandNames: readonly string[] = [
    'install',
    'i',
    'add',
    'isntall',
    'in',
    'ins',
    'inst',
    'insta',
    'instal',
    'isnt',
    'isnta',
  ];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const positionals = command.getPositionals();
    const hasPackages = positionals.length > 0;
    const isLockfileOnly = command.hasFlag('package-lock-only');

    const targetCommandName = hasPackages && !isLockfileOnly ? 'add' : 'install';
    let translatedParams = translateCommonFlags(command.params);

    if (isLockfileOnly) {
      translatedParams = translatedParams.filter((p) => !p.matchesName('package-lock-only'));
      if (!translatedParams.some((p) => p.matchesName('lockfile-only'))) {
        translatedParams.push(CommandParam.longFlag('lockfile-only'));
      }
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName(targetCommandName).withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
