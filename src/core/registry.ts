import type { Command } from './command.js';
import type { CommandConverter } from './converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { TARGET_NPM, TARGET_PNPM } from '../config/versions.js';
import { InstallConverter } from '../converters/install.js';
import { CiConverter } from '../converters/ci.js';
import { UninstallConverter } from '../converters/uninstall.js';
import { UpdateConverter } from '../converters/update.js';
import { OutdatedConverter } from '../converters/outdated.js';
import { AuditConverter } from '../converters/audit.js';
import { PruneConverter } from '../converters/prune.js';
import { DedupeConverter } from '../converters/dedupe.js';
import { ListConverter } from '../converters/list.js';
import { WhyConverter } from '../converters/why.js';
import { PackConverter } from '../converters/pack.js';
import { InitConverter } from '../converters/init.js';
import { PkgConverter } from '../converters/pkg.js';
import { LinkConverter } from '../converters/link.js';
import { RootConverter } from '../converters/root.js';
import { RunConverter } from '../converters/run.js';
import { ExecConverter } from '../converters/exec.js';
import { CacheConverter } from '../converters/cache.js';
import { PatchConverter } from '../converters/patch.js';
import { ApproveBuildsConverter } from '../converters/approve-builds.js';
import { DefaultConverter } from '../converters/default.js';

export class ConverterRegistry {
  private readonly converters = new Map<string, CommandConverter>();
  private readonly fallbackConverter: CommandConverter;

  constructor(fallback?: CommandConverter) {
    this.fallbackConverter = fallback ?? new DefaultConverter();
  }

  register(converter: CommandConverter): this {
    for (const name of converter.commandNames) {
      this.converters.set(name.toLowerCase(), converter);
    }
    return this;
  }

  find(commandName: string): CommandConverter {
    const matched = this.converters.get(commandName.toLowerCase());
    return matched ?? this.fallbackConverter;
  }

  has(commandName: string): boolean {
    return this.converters.has(commandName.toLowerCase());
  }

  async convert(command: Command, partialCtx?: Partial<ConversionContext>): Promise<ConversionResult> {
    const ctx: ConversionContext = {
      cwd: partialCtx?.cwd ?? process.cwd(),
      env: partialCtx?.env ?? process.env,
      npmVersion: partialCtx?.npmVersion ?? TARGET_NPM.targetVersion,
      pnpmVersion: partialCtx?.pnpmVersion ?? TARGET_PNPM.targetVersion,
    };

    const converter = this.find(command.name);
    return converter.convert(command, ctx);
  }

  static createDefault(): ConverterRegistry {
    const registry = new ConverterRegistry();
    registry
      .register(new InstallConverter())
      .register(new CiConverter())
      .register(new UninstallConverter())
      .register(new UpdateConverter())
      .register(new OutdatedConverter())
      .register(new AuditConverter())
      .register(new PruneConverter())
      .register(new DedupeConverter())
      .register(new ListConverter())
      .register(new WhyConverter())
      .register(new PackConverter())
      .register(new InitConverter())
      .register(new PkgConverter())
      .register(new LinkConverter())
      .register(new RootConverter())
      .register(new RunConverter())
      .register(new ExecConverter())
      .register(new CacheConverter())
      .register(new PatchConverter())
      .register(new ApproveBuildsConverter());

    return registry;
  }
}
