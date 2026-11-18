import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export function handleApproveBuilds(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const isDenyDirect = command.name === 'deny-scripts';
  const positionals = command.getPositionals();

  // npm install-scripts approve <pkg> | deny <pkg> | ls | prune
  let isDeny = isDenyDirect;
  let filteredParams = command.params;

  if (command.name === 'install-scripts') {
    const subAction = positionals[0];
    if (subAction === 'deny') {
      isDeny = true;
      filteredParams = command.params.filter((p) => !(p.isPositional && p.raw === 'deny'));
    } else if (subAction === 'approve' || subAction === 'ls' || subAction === 'list' || subAction === 'prune') {
      filteredParams = command.params.filter((p) => !(p.isPositional && p.raw === subAction));
    }
  }

  const translatedParams: CommandParam[] = [];

  for (const p of translate(command.withParams(filteredParams))) {
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
