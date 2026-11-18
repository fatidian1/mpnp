import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

export function handleExec(command: Command, _ctx: ConversionContext): ConversionResult {
  const positionals = command.getPositionals();
  const pkgFlag = command.getFlagValue('package') || command.getFlagValue('p');

  return {
    type: 'custom',
    description: `Execute command locally via pnpm exec or remotely via pnpm dlx`,
    handler: async (execCtx: ExecutionContext) => {
      if (positionals.length === 0) {
        execCtx.stderr.write('Usage: npm exec [--] <cmd> [args...]\n');
        return 1;
      }

      const targetCmd = positionals[0];
      const targetArgs = positionals.slice(1);

      // Check if binary exists in local node_modules/.bin
      const localBinPath = resolve(execCtx.cwd, 'node_modules', '.bin', targetCmd);
      const existsLocally = existsSync(localBinPath);

      const subCommand = existsLocally ? 'exec' : 'dlx';
      const pnpmArgs: string[] = [subCommand];

      if (!existsLocally && pkgFlag) {
        pnpmArgs.push('--package', pkgFlag);
      }

      pnpmArgs.push(targetCmd, ...targetArgs);

      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] pnpm ${pnpmArgs.join(' ')}\n`);
        return 0;
      }

      return new Promise<number>((res) => {
        const child = spawn('pnpm', pnpmArgs, {
          cwd: execCtx.cwd,
          env: execCtx.env,
          stdio: 'inherit',
        });

        child.on('error', (err) => {
          execCtx.stderr.write(`mpnp exec error: ${err.message}\n`);
          res(1);
        });

        child.on('close', (code) => {
          res(code ?? 0);
        });
      });
    },
  };
}
