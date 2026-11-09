import { PackageManager } from '../types/index.js';
import { CommandParam } from './param.js';
import type { ConverterRegistry } from './registry.js';
import { handleInstall } from '../converters/install.js';
import { handleCache } from '../converters/cache.js';
import { handleInit } from '../converters/init.js';
import { handlePack } from '../converters/pack.js';
import { handlePatch } from '../converters/patch.js';
import { handleApproveBuilds } from '../converters/approve-builds.js';

export function configureDefaultRegistry(registry: ConverterRegistry): ConverterRegistry {
  // === GLOBAL FLAGS ===
  registry
    .flag(['workspace', 'w'], (val) => (val !== undefined ? `--filter=${val}` : '--filter'))
    .flag(['workspaces', 'ws'], () => '-r')
    .flag('prefix', (val) => (val !== undefined ? `-C=${val}` : '-C'))
    .flag('package-lock-only', () => '--lockfile-only')
    .flag('legacy-peer-deps', () => '--no-strict-peer-dependencies')
    .flag('production', () => '--prod')
    .flag('omit', (val) =>
      val === 'dev' ? '--prod' : val === 'optional' ? '--no-optional' : val !== undefined ? `--omit=${val}` : '--omit'
    )
    .flag('save-exact', () => '-E')
    .flag('save-dev', () => '-D')
    .flag('save-optional', () => '-O')
    .flag('searchlimit', (val) => (val !== undefined ? `--search-limit=${val}` : '--search-limit'))
    .flag('cache', (val) => (val !== undefined ? `--cache-dir=${val}` : '--cache-dir'))
    .dropFlag(
      'save',
      'S',
      'no-update-notifier',
      'update-notifier',
      'no-fund',
      'fund',
      'no-audit',
      'audit',
      'no-description',
      'description'
    );

  // === 1:1 PASSTHROUGH & ALIAS COMMANDS ===
  registry.passthrough('outdated', 'prune', 'pkg', 'exec');
  registry.command(['update', 'up', 'upgrade'], 'update');
  registry.command(['why', 'explain'], 'why');
  registry.command(['view', 'info', 'show', 'v'], 'view');
  registry.command(['search', 's', 'se', 'find'], 'search');

  // === COMMAND-SCOPED FLAGS ===
  registry.command(['dedupe', 'find-dupes', 'ddp'], 'dedupe').flag('dry-run', () => '--check');

  registry.command(['ci', 'clean-install', 'ic'], 'install').handle((cmd, _ctx, translate) => {
    const params = translate(cmd);
    if (!params.some((p) => p.matchesName('frozen-lockfile'))) {
      params.push(CommandParam.longFlag('frozen-lockfile'));
    }
    return {
      type: 'pnpm',
      command: cmd.withPM(PackageManager.PNPM).withName('install').withParams(params),
    };
  });

  registry
    .command(['list', 'ls', 'll', 'la'], 'list')
    .flag(['all', 'a'], () => '--depth=Infinity')
    .handle((cmd, _ctx, translate) => {
      const isLongFormat = cmd.name === 'll' || cmd.name === 'la' || cmd.hasFlag('long', 'l');
      let params = translate(cmd);
      if (isLongFormat && !params.some((p) => p.matchesName('long'))) {
        params = [...params, CommandParam.longFlag('long')];
      }
      return {
        type: 'pnpm',
        command: cmd.withPM(PackageManager.PNPM).withName('list').withParams(params),
      };
    });

  registry.command(['link'], 'link').handle((cmd, _ctx, translate) => {
    const positionals = cmd.getPositionals();
    const params = translate(cmd);
    if (positionals.length === 0 && !cmd.hasFlag('global', 'g')) {
      params.push(CommandParam.longFlag('global'));
    }
    return {
      type: 'pnpm',
      command: cmd.withPM(PackageManager.PNPM).withName('link').withParams(params),
    };
  });

  registry.command(['uninstall', 'unlink', 'remove', 'rm', 'r', 'un'], 'remove').handle((cmd, _ctx, translate) => {
    const positionals = cmd.getPositionals();
    if (cmd.name === 'unlink' && positionals.length === 0) {
      return {
        type: 'pnpm',
        command: cmd.withPM(PackageManager.PNPM).withName('unlink').withParams(translate(cmd)),
      };
    }
    return {
      type: 'pnpm',
      command: cmd.withPM(PackageManager.PNPM).withName('remove').withParams(translate(cmd)),
    };
  });

  registry.command(['root', 'prefix', 'bin']).handle((cmd, _ctx, translate) => {
    const targetName = cmd.name === 'prefix' ? 'root' : cmd.name;
    return {
      type: 'pnpm',
      command: cmd.withPM(PackageManager.PNPM).withName(targetName).withParams(translate(cmd)),
    };
  });

  registry
    .command(['run', 'run-script', 'test', 't', 'tst', 'start', 'stop', 'restart'])
    .handle((cmd, _ctx, translate) => {
      let targetName = cmd.name;
      if (targetName === 'run-script') {
        targetName = 'run';
      } else if (targetName === 't' || targetName === 'tst') {
        targetName = 'test';
      }
      return {
        type: 'pnpm',
        command: cmd.withPM(PackageManager.PNPM).withName(targetName).withParams(translate(cmd)),
      };
    });

  registry.command(['audit'], 'audit').handle((cmd, _ctx, translate) => {
    const positionals = cmd.getPositionals();
    const hasFix = positionals.includes('fix');
    const filteredParams = cmd.params.filter((p) => !(p.isPositional && p.raw === 'fix'));
    const params = translate(cmd.withParams(filteredParams));
    if (hasFix && !params.some((p) => p.matchesName('fix'))) {
      params.push(CommandParam.longFlag('fix'));
    }
    return {
      type: 'pnpm',
      command: cmd.withPM(PackageManager.PNPM).withName('audit').withParams(params),
    };
  });

  // === COMPLEX DOMAIN COMMANDS ===
  registry
    .command(['install', 'i', 'add', 'isntall', 'in', 'ins', 'inst', 'insta', 'instal', 'isnt', 'isnta'])
    .handle(handleInstall);

  registry.command(['cache']).handle(handleCache);
  registry.command(['init', 'create', 'innit']).handle(handleInit);
  registry.command(['pack']).handle(handlePack);
  registry.command(['patch', 'patch-commit']).handle(handlePatch);
  registry.command(['approve-scripts', 'deny-scripts', 'approve-builds']).handle(handleApproveBuilds);

  return registry;
}
