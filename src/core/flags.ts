import { CommandParam } from './param.js';

export function translateCommonFlags(params: readonly CommandParam[]): CommandParam[] {
  const result: CommandParam[] = [];

  for (const p of params) {
    if (!p.isFlag) {
      result.push(p);
      continue;
    }

    // Workspace: -w <name> / --workspace=<name> -> --filter <name>
    if (p.matchesName('workspace', 'w')) {
      result.push(CommandParam.longFlag('filter', p.value));
      continue;
    }

    // Workspaces: -ws / --workspaces -> -r
    if (p.matchesName('workspaces', 'ws')) {
      result.push(CommandParam.shortFlag('r'));
      continue;
    }

    // Prefix: --prefix <dir> -> -C <dir>
    if (p.matchesName('prefix')) {
      result.push(CommandParam.shortFlag('C', p.value));
      continue;
    }

    // Lockfile only: --package-lock-only -> --lockfile-only
    if (p.matchesName('package-lock-only')) {
      result.push(CommandParam.longFlag('lockfile-only'));
      continue;
    }

    // Legacy peer deps: --legacy-peer-deps -> --no-strict-peer-dependencies
    if (p.matchesName('legacy-peer-deps')) {
      result.push(CommandParam.longFlag('no-strict-peer-dependencies'));
      continue;
    }

    // Production / Omit dev
    if (p.matchesName('production')) {
      result.push(CommandParam.longFlag('prod'));
      continue;
    }

    if (p.matchesName('omit')) {
      if (p.value === 'dev') {
        result.push(CommandParam.longFlag('prod'));
        continue;
      }
      if (p.value === 'optional') {
        result.push(CommandParam.longFlag('no-optional'));
        continue;
      }
      // other omit values
    }

    // Exact: --save-exact -> -E
    if (p.matchesName('save-exact')) {
      result.push(CommandParam.shortFlag('E'));
      continue;
    }

    // Dev: --save-dev -> -D
    if (p.matchesName('save-dev')) {
      result.push(CommandParam.shortFlag('D'));
      continue;
    }

    // Optional: --save-optional -> -O
    if (p.matchesName('save-optional')) {
      result.push(CommandParam.shortFlag('O'));
      continue;
    }

    // Save: -S / --save -> drop (pnpm add saves by default; pnpm has no bare --save/-S)
    if (p.matchesName('save', 'S')) {
      continue;
    }

    // Search limit: --searchlimit <n> -> --search-limit <n>
    if (p.matchesName('searchlimit')) {
      result.push(CommandParam.longFlag('search-limit', p.value));
      continue;
    }

    // Cache dir: --cache <dir> -> --cache-dir <dir> (supported since pnpm 12.16.1)
    if (p.matchesName('cache')) {
      result.push(CommandParam.longFlag('cache-dir', p.value));
      continue;
    }

    // Description: --no-description / --description -> drop (unsupported in pnpm search)
    if (p.matchesName('description', 'no-description')) {
      continue;
    }

    // Update notifier: --no-update-notifier / --update-notifier -> drop (npm-specific)
    if (p.matchesName('update-notifier', 'no-update-notifier')) {
      continue;
    }

    // Fund: --no-fund / --fund -> drop (npm-specific)
    if (p.matchesName('fund', 'no-fund')) {
      continue;
    }

    // Audit: --no-audit / --audit -> drop (npm-specific flags on install/update/etc.)
    if (p.matchesName('audit', 'no-audit')) {
      continue;
    }

    // Pass through as is
    result.push(p);
  }

  return result;
}
