import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export function handleCache(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();
  const subAction = positionals[0];

  const remainingParams = command.params.filter((p) => !(p.isPositional && p.raw === subAction));
  const translatedParams = translate(command.withParams(remainingParams));

  if (subAction === 'clean') {
    return {
      type: 'pnpm',
      command: command
        .withPM(PackageManager.PNPM)
        .withName('store')
        .withParams([CommandParam.positional('prune'), ...translatedParams]),
    };
  }

  if (subAction === 'add') {
    return {
      type: 'pnpm',
      command: command
        .withPM(PackageManager.PNPM)
        .withName('store')
        .withParams([CommandParam.positional('add'), ...translatedParams]),
    };
  }

  // cache ls, cache verify, etc.
  return {
    type: 'pnpm',
    command: command
      .withPM(PackageManager.PNPM)
      .withName('store')
      .withParams([CommandParam.positional('status'), ...translatedParams]),
  };
}
