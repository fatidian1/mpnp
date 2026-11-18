import { spawn } from 'node:child_process';
import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

function runChild(commandName: string, args: string[], execCtx: ExecutionContext): Promise<number> {
  return new Promise<number>((resolve) => {
    const child = spawn(commandName, args, {
      cwd: execCtx.cwd,
      env: execCtx.env,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      execCtx.stderr.write(`Failed to start ${commandName}: ${err.message}\n`);
      resolve(1);
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });
  });
}

export function handleInstallCiTest(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const translatedParams = translate(command);
  const pnpmCiArgs = ['ci', ...translatedParams.map((p) => p.raw)];

  return {
    type: 'custom',
    description: 'Run pnpm ci followed by pnpm test',
    handler: async (execCtx: ExecutionContext) => {
      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] pnpm ${pnpmCiArgs.join(' ')} && pnpm test\n`);
        return 0;
      }

      const ciExitCode = await runChild('pnpm', pnpmCiArgs, execCtx);
      if (ciExitCode !== 0) {
        return ciExitCode;
      }

      return runChild('pnpm', ['test'], execCtx);
    },
  };
}

export function handleInstallTest(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();
  const hasPackages = positionals.length > 0;

  if (!hasPackages) {
    const translatedParams = translate(command);
    return {
      type: 'pnpm',
      command: command.withPM(PackageManager.PNPM).withName('install-test').withParams(translatedParams),
    };
  }

  // Packages provided: pnpm add <pkgs> <flags> && pnpm test
  const translatedParams = translate(command);
  const addArgs = ['add', ...translatedParams.map((p) => p.raw)];

  return {
    type: 'custom',
    description: `Run pnpm add for packages followed by pnpm test`,
    handler: async (execCtx: ExecutionContext) => {
      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] pnpm ${addArgs.join(' ')} && pnpm test\n`);
        return 0;
      }

      const addExitCode = await runChild('pnpm', addArgs, execCtx);
      if (addExitCode !== 0) {
        return addExitCode;
      }

      return runChild('pnpm', ['test'], execCtx);
    },
  };
}
