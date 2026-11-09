import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export function handleInstall(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();
  const hasPackages = positionals.length > 0;
  const isLockfileOnly = command.hasFlag('package-lock-only');

  const targetCommandName = hasPackages && !isLockfileOnly ? 'add' : 'install';
  let translatedParams = translate(command);

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
