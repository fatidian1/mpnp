import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { TARGET_PNPM } from '../config/versions.js';
import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandParam } from '../core/param.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

export function handleVersion(
  command: Command,
  _ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
): ConversionResult {
  const positionals = command.getPositionals();

  // Case 1: npm version without arguments -> print version JSON (like npm)
  if (positionals.length === 0) {
    return {
      type: 'custom',
      description: 'Display project and environment versions JSON',
      handler: async (execCtx: ExecutionContext) => {
        let pkgName = 'unnamed';
        let pkgVersion = '0.0.0';

        try {
          const pkgRaw = await readFile(resolve(execCtx.cwd, 'package.json'), 'utf8');
          const parsed = JSON.parse(pkgRaw);
          pkgName = parsed.name || pkgName;
          pkgVersion = parsed.version || pkgVersion;
        } catch {
          // If no package.json in cwd, continue with versions
        }

        const versionsObj: Record<string, string> = {
          [pkgName]: pkgVersion,
          pnpm: TARGET_PNPM.targetVersion,
          node: process.versions.node,
          v8: process.versions.v8,
          uv: process.versions.uv,
          zlib: process.versions.zlib,
          brotli: process.versions.brotli ?? '',
          ares: process.versions.ares,
          modules: process.versions.modules,
          openssl: process.versions.openssl,
        };

        if (execCtx.dryRun) {
          execCtx.stdout.write(`[mpnp dry-run] print versions: ${JSON.stringify(versionsObj)}\n`);
          return 0;
        }

        execCtx.stdout.write(JSON.stringify(versionsObj, null, 2) + '\n');
        return 0;
      },
    };
  }

  // Case 2: Version bump arguments (patch, minor, major, 1.2.3, etc.)
  const translatedParams = translate(command);
  const pnpmCommand = command.withPM(PackageManager.PNPM).withName('version').withParams(translatedParams);

  return {
    type: 'pnpm',
    command: pnpmCommand,
  };
}
