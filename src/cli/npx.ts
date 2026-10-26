import { spawn } from 'node:child_process';

async function run(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const pnpmArgs: string[] = [];
  let isDlx = true;

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === '-y' || arg === '--yes') {
      // pnpm dlx automatically downloads without confirmation, safe to ignore
      continue;
    }

    if (arg === '--no-install') {
      isDlx = false;
      continue;
    }

    if (arg === '-p' || arg === '--package') {
      if (i + 1 < rawArgs.length) {
        pnpmArgs.push('--package', rawArgs[++i]);
      }
      continue;
    }

    pnpmArgs.push(arg);
  }

  const subCommand = isDlx ? 'dlx' : 'exec';

  const exitCode = await new Promise<number>((res, rej) => {
    const child = spawn('pnpm', [subCommand, ...pnpmArgs], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', (err) => rej(err));
    child.on('close', (code) => res(code ?? 0));
  });

  process.exit(exitCode);
}

run().catch((err) => {
  process.stderr.write(`mpnp npx error: ${(err as Error).message}\n`);
  process.exit(1);
});
