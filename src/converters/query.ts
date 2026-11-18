import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

interface QueryItem {
  name: string;
  version: string;
  location: string;
  path: string;
  realpath: string;
  dev: boolean;
  [key: string]: unknown;
}

export function handleQuery(command: Command, _ctx: ConversionContext): ConversionResult {
  const positionals = command.getPositionals();
  const selector = positionals[0] || '*';

  return {
    type: 'custom',
    description: `Query dependency tree for ${selector} via @pnpm/napi`,
    handler: async (execCtx: ExecutionContext) => {
      let rootPkg: Record<string, unknown> = {};
      try {
        const rootPkgRaw = await readFile(resolve(execCtx.cwd, 'package.json'), 'utf8');
        rootPkg = JSON.parse(rootPkgRaw);
      } catch {
        // Ignored if missing
      }

      const rootItem: QueryItem = {
        ...(rootPkg as Record<string, unknown>),
        name: (rootPkg.name as string) || 'unnamed',
        version: (rootPkg.version as string) || '0.0.0',
        location: '',
        path: execCtx.cwd,
        realpath: execCtx.cwd,
        dev: false,
      };

      if (selector === ':root') {
        const out = JSON.stringify([rootItem], null, 2) + '\n';
        if (execCtx.dryRun) {
          execCtx.stdout.write(`[mpnp dry-run] query :root\n`);
          return 0;
        }
        execCtx.stdout.write(out);
        return 0;
      }

      let results: QueryItem[] = [];

      try {
        // Dynamically import @pnpm/napi (handling ESM/CJS default wrapper interop)
        const napi = await import('@pnpm/napi');
        const napiExports = (napi.default ?? napi) as typeof import('@pnpm/napi');
        const lock = await napiExports.readLockfile({ dir: execCtx.cwd });

        const importers = lock?.importers as
          | Record<string, { devDependencies?: Record<string, string>; dependencies?: Record<string, string> }>
          | undefined;
        const devDeps = new Set(Object.keys(importers?.['.']?.devDependencies || {}));
        const prodDeps = new Set(Object.keys(importers?.['.']?.dependencies || {}));

        const items: QueryItem[] = [];

        // Add root if matching '*'
        if (selector === '*' || selector === '') {
          items.push(rootItem);
        }

        if (lock?.packages) {
          for (const [key] of Object.entries(lock.packages)) {
            // key is typically "@scope/name@version" or "name@version"
            const lastAt = key.lastIndexOf('@');
            if (lastAt <= 0) {
              continue;
            }

            const name = key.slice(0, lastAt);
            const version = key.slice(lastAt + 1);
            const isDev = devDeps.has(name);
            const isProd = prodDeps.has(name);

            const item: QueryItem = {
              name,
              version,
              location: `node_modules/${name}`,
              path: resolve(execCtx.cwd, 'node_modules', name),
              realpath: resolve(execCtx.cwd, 'node_modules', name),
              dev: isDev && !isProd,
            };

            items.push(item);
          }
        }

        // Apply simple selector filtering
        if (selector === '.dev') {
          results = items.filter((i) => i.dev === true);
        } else if (selector === '.prod') {
          results = items.filter((i) => i.dev === false && i !== rootItem);
        } else if (selector.startsWith('[name=') && selector.endsWith(']')) {
          const expectedName = selector.slice(6, -1).replace(/['"]/g, '');
          results = items.filter((i) => i.name === expectedName);
        } else if (selector !== '*' && selector !== '') {
          // Direct package name selector, e.g. "vitest"
          results = items.filter((i) => i.name === selector);
        } else {
          results = items;
        }
      } catch (err) {
        execCtx.stderr.write(`query warning: failed to read lockfile via @pnpm/napi: ${(err as Error).message}\n`);
        results = [rootItem];
      }

      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] query ${selector} -> ${results.length} items\n`);
        return 0;
      }

      execCtx.stdout.write(JSON.stringify(results, null, 2) + '\n');
      return 0;
    },
  };
}
