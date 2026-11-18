import { spawn } from 'node:child_process';
import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

export function handleDiff(command: Command, _ctx: ConversionContext): ConversionResult {
  const gitArgs: string[] = ['diff'];

  for (const p of command.params) {
    if (p.isPositional) {
      gitArgs.push(p.raw);
      continue;
    }

    if (p.matchesName('diff-name-only') || p.matchesName('name-only')) {
      gitArgs.push('--name-only');
    } else if (p.matchesName('diff-unified')) {
      gitArgs.push(`-U${p.value ?? '3'}`);
    } else if (p.matchesName('diff-ignore-all-space') || p.matchesName('ignore-all-space')) {
      gitArgs.push('-w');
    } else if (p.matchesName('stat') || p.matchesName('diff-stat')) {
      gitArgs.push('--stat');
    } else if (p.matchesName('diff') && p.value) {
      gitArgs.push(p.value);
    } else if (p.isFlag && !p.name?.startsWith('diff')) {
      // Forward generic git diff flags
      gitArgs.push(p.raw);
    }
  }

  return {
    type: 'custom',
    description: `git ${gitArgs.join(' ')}`,
    handler: async (execCtx: ExecutionContext) => {
      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] git ${gitArgs.join(' ')}\n`);
        return 0;
      }

      return new Promise<number>((resolve) => {
        const child = spawn('git', gitArgs, {
          cwd: execCtx.cwd,
          env: execCtx.env,
          stdio: 'inherit',
        });

        child.on('error', (err) => {
          execCtx.stderr.write(`mpnp diff error: ${err.message}\n`);
          resolve(1);
        });

        child.on('close', (code) => {
          resolve(code ?? 0);
        });
      });
    },
  };
}
