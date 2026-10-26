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

    // Pass through as is
    result.push(p);
  }

  return result;
}
