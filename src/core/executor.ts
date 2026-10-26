import { spawn } from 'node:child_process';
import type { ConversionResult, ExecutionContext } from '../types/index.js';

export interface ExecutorOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
  dryRun?: boolean;
}

export async function executeResult(result: ConversionResult, options?: ExecutorOptions): Promise<number> {
  const cwd = options?.cwd ?? process.cwd();
  const env = options?.env ?? process.env;
  const stdout = options?.stdout ?? process.stdout;
  const stderr = options?.stderr ?? process.stderr;
  const dryRun = options?.dryRun ?? false;

  const ctx: ExecutionContext = {
    cwd,
    env,
    stdout,
    stderr,
    dryRun,
  };

  if (result.type === 'noop') {
    return result.exitCode ?? 0;
  }

  if (result.type === 'custom') {
    const code = await result.handler(ctx);
    return typeof code === 'number' ? code : 0;
  }

  if (dryRun) {
    stdout.write(`[mpnp dry-run] ${result.command.toString()}\n`);
    if (result.postActions && result.postActions.length > 0) {
      for (const action of result.postActions) {
        stdout.write(`[mpnp dry-run post-action] ${action.description}\n`);
      }
    }
    return 0;
  }

  const pnpmArgs = result.command.toArgs();

  const exitCode = await new Promise<number>((res, rej) => {
    const child = spawn('pnpm', pnpmArgs, {
      cwd,
      env,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      rej(err);
    });

    child.on('close', (code) => {
      res(code ?? 0);
    });
  });

  if (exitCode === 0 && result.postActions && result.postActions.length > 0) {
    for (const action of result.postActions) {
      await action.run(ctx);
    }
  }

  return exitCode;
}
