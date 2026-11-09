import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';
import { fetchRemoteTarball } from '../utils/tarball.js';

export function isLocalPath(target: string, cwd: string): boolean {
  if (target.startsWith('.') || target.startsWith('/') || target.startsWith('~') || target.startsWith('file:')) {
    return true;
  }
  const resolved = resolve(cwd, target);
  try {
    return existsSync(resolved) && statSync(resolved).isDirectory();
  } catch {
    return false;
  }
}

export function handlePack(
  command: Command,
  ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();
  const isDryRun = command.hasFlag('dry-run');
  const isJson = command.hasFlag('json');
  const destDir = command.getFlagValue('pack-destination') || ctx.cwd;
  const registry = command.getFlagValue('registry');

  // Case 1: No arguments or all arguments are local paths -> delegate to pnpm pack
  const hasRemoteSpecs = positionals.some((pos) => !isLocalPath(pos, ctx.cwd));

  if (!hasRemoteSpecs) {
    const translatedParams = translate(command);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('pack').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  // Case 2: Contains remote package names (e.g. `npm pack lodash`) -> fetch tarball(s)
  return {
    type: 'custom',
    description: `Download remote tarball(s) for ${positionals.join(', ')}`,
    handler: async (execCtx: ExecutionContext) => {
      const results = [];
      for (const spec of positionals) {
        if (isLocalPath(spec, execCtx.cwd)) {
          continue;
        }
        const info = await fetchRemoteTarball({
          spec,
          destinationDir: destDir,
          registry,
          dryRun: isDryRun || execCtx.dryRun,
        });
        results.push(info);
      }

      if (isJson) {
        const jsonOutput = results.map((r) => ({
          id: `${r.packageName}@${r.version}`,
          name: r.packageName,
          version: r.version,
          size: r.sizeBytes,
          unpackedSize: r.sizeBytes,
          filename: r.filename,
          tarballUrl: r.tarballUrl,
        }));
        execCtx.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
      } else {
        for (const r of results) {
          execCtx.stdout.write(`${r.filename}\n`);
        }
      }

      return 0;
    },
  };
}
