import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult, PostAction, ExecutionContext } from '../types/index.js';

export function handleInit(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();
  const scope = command.getFlagValue('scope');

  // Case 1: Initializer passed, e.g. `npm init react-app my-app` or `npm create vite`
  if (positionals.length > 0) {
    const translatedParams = translate(command);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('create').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  // Case 2: Standalone init
  const filteredParams = command.params.filter((p) => !p.matchesName('scope'));
  const translatedParams = translate(command.withParams(filteredParams));

  const postActions: PostAction[] = [];
  if (scope) {
    postActions.push({
      description: `Set package.json scope to @${scope}`,
      run: async (execCtx: ExecutionContext) => {
        const pkgPath = resolve(execCtx.cwd, 'package.json');
        try {
          const raw = await readFile(pkgPath, 'utf8');
          const data = JSON.parse(raw);
          const currentName: string = data.name || 'unnamed';
          const cleanName = currentName.includes('/') ? currentName.split('/').pop()! : currentName;
          data.name = `@${scope.replace(/^@/, '')}/${cleanName}`;
          await writeFile(pkgPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        } catch (err) {
          execCtx.stderr.write(`Warning: Failed to update scope in package.json: ${(err as Error).message}\n`);
        }
      },
    });
  }

  const pnpmCommand = command.withPM(PackageManager.PNPM).withName('init').withParams(translatedParams);

  return {
    type: 'pnpm',
    command: pnpmCommand,
    postActions,
  };
}
