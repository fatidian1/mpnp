import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export function handleApproveBuilds(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const isDeny = command.name === 'deny-scripts';
  const translatedParams: CommandParam[] = [];

  for (const p of translate(command)) {
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
