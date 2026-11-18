import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

export function handleExplore(command: Command, _ctx: ConversionContext): ConversionResult {
  const positionals = command.getPositionals();

  if (positionals.length === 0) {
    return {
      type: 'custom',
      description: 'npm explore requires a package name',
      handler: async (execCtx: ExecutionContext) => {
        execCtx.stderr.write('Usage: npm explore <pkg> [ -- <command>]\n');
        return 1;
      },
    };
  }

  const pkgName = positionals[0];
  const subCommand = positionals.slice(1);

  return {
    type: 'custom',
    description: `Explore package ${pkgName} in subshell or run command`,
    handler: async (execCtx: ExecutionContext) => {
      const targetDir = resolve(execCtx.cwd, 'node_modules', pkgName);

      if (!existsSync(targetDir)) {
        execCtx.stderr.write(`explore error: It doesn't look like '${pkgName}' is installed in ${targetDir}\n`);
        return 1;
      }

      if (execCtx.dryRun) {
        const cmdStr = subCommand.length > 0 ? subCommand.join(' ') : execCtx.env.SHELL || 'bash';
        execCtx.stdout.write(`[mpnp dry-run] cd ${targetDir} && ${cmdStr}\n`);
        return 0;
      }

      if (subCommand.length > 0) {
        const [bin, ...args] = subCommand;
        return new Promise<number>((res) => {
          const child = spawn(bin, args, {
            cwd: targetDir,
            env: execCtx.env,
            stdio: 'inherit',
          });

          child.on('error', (err) => {
            execCtx.stderr.write(`Failed to run command in ${targetDir}: ${err.message}\n`);
            res(1);
          });

          child.on('close', (code) => {
            res(code ?? 0);
          });
        });
      }

      // Interactive subshell
      const shell = execCtx.env.SHELL || 'bash';
      execCtx.stdout.write(`\nExploring ${targetDir}\nType 'exit' or ^D when finished\n\n`);

      return new Promise<number>((res) => {
        const child = spawn(shell, [], {
          cwd: targetDir,
          env: execCtx.env,
          stdio: 'inherit',
        });

        child.on('error', (err) => {
          execCtx.stderr.write(`Failed to spawn shell in ${targetDir}: ${err.message}\n`);
          res(1);
        });

        child.on('close', (code) => {
          res(code ?? 0);
        });
      });
    },
  };
}
