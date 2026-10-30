import { PackageManager } from '../types/index.js';
import { CommandParam } from './param.js';
import { Command } from './command.js';

const FLAGS_WITH_ARGUMENT = new Set([
  'workspace',
  'w',
  'prefix',
  'C',
  'dir',
  'pack-destination',
  'depth',
  'loglevel',
  'registry',
  'audit-level',
  'scope',
  'userconfig',
  'filter',
  'F',
  'store-dir',
  'state-dir',
  'omit',
  'include',
  'searchlimit',
  'search-limit',
]);

export function parseArgs(rawTokens: readonly string[], pm: PackageManager = PackageManager.NPM): Command {
  const params: CommandParam[] = [];
  let commandName = '';
  let inEndOfFlags = false;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];

    if (inEndOfFlags) {
      params.push(CommandParam.positional(token));
      continue;
    }

    if (token === '--') {
      inEndOfFlags = true;
      params.push(CommandParam.endOfFlags());
      continue;
    }

    if (token.startsWith('--')) {
      const eqIndex = token.indexOf('=');
      if (eqIndex !== -1) {
        const name = token.slice(2, eqIndex);
        const value = token.slice(eqIndex + 1);
        params.push(CommandParam.longFlag(name, value));
      } else {
        const name = token.slice(2);
        if (FLAGS_WITH_ARGUMENT.has(name) && i + 1 < rawTokens.length && !rawTokens[i + 1].startsWith('-')) {
          const value = rawTokens[++i];
          params.push(CommandParam.longFlag(name, value));
        } else {
          params.push(CommandParam.longFlag(name));
        }
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      const eqIndex = token.indexOf('=');
      if (eqIndex !== -1) {
        const name = token.slice(1, eqIndex);
        const value = token.slice(eqIndex + 1);
        params.push(CommandParam.shortFlag(name, value));
      } else {
        const name = token.slice(1);
        if (FLAGS_WITH_ARGUMENT.has(name) && i + 1 < rawTokens.length && !rawTokens[i + 1].startsWith('-')) {
          const value = rawTokens[++i];
          params.push(CommandParam.shortFlag(name, value));
        } else {
          params.push(CommandParam.shortFlag(name));
        }
      }
      continue;
    }

    // Positional argument
    if (!commandName) {
      commandName = token;
    } else {
      params.push(CommandParam.positional(token));
    }
  }

  return new Command({
    pm,
    name: commandName,
    params,
    rawTokens: [...rawTokens],
  });
}
