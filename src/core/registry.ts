import { PackageManager } from '../types/index.js';
import type { Command } from './command.js';
import type { CommandParam } from './param.js';
import type { CommandConverter } from './converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { TARGET_NPM, TARGET_PNPM } from '../config/versions.js';
import { CommandBuilder, parseConvertedResult, type FlagConverterCallback } from './builder.js';
import { configureDefaultRegistry } from './defaults.js';

export {
  CommandBuilder,
  parseParamString,
  parseConvertedResult,
  type FlagConverterCallback,
  type CommandHandler,
} from './builder.js';

export class ConverterRegistry {
  private readonly commands = new Map<string, CommandBuilder>();
  private readonly globalFlagConverters = new Map<string, FlagConverterCallback>();
  private readonly globalDroppedFlags = new Set<string>();

  flag(names: string | string[], converter: FlagConverterCallback): this {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      this.globalFlagConverters.set(name.toLowerCase(), converter);
    }
    return this;
  }

  dropFlag(...names: string[]): this {
    for (const name of names) {
      this.globalDroppedFlags.add(name.toLowerCase());
    }
    return this;
  }

  command(names: string | string[], targetOrOptions?: string | { target?: string }): CommandBuilder {
    const target = typeof targetOrOptions === 'string' ? targetOrOptions : targetOrOptions?.target;
    const builder = new CommandBuilder(names, target);
    for (const name of builder.commandNames) {
      this.commands.set(name.toLowerCase(), builder);
    }
    return builder;
  }

  passthrough(...names: string[]): this {
    for (const name of names) {
      this.command(name, name);
    }
    return this;
  }

  register(converter: CommandConverter): this {
    if (converter instanceof CommandBuilder) {
      for (const name of converter.commandNames) {
        this.commands.set(name.toLowerCase(), converter);
      }
      return this;
    }

    const builder = new CommandBuilder([...converter.commandNames]);
    builder.handle((cmd, ctx) => converter.convert(cmd, ctx));
    for (const name of converter.commandNames) {
      this.commands.set(name.toLowerCase(), builder);
    }
    return this;
  }

  getCommand(name: string): CommandBuilder | undefined {
    return this.commands.get(name.toLowerCase());
  }

  has(commandName: string): boolean {
    return this.commands.has(commandName.toLowerCase());
  }

  find(commandName: string): CommandConverter {
    const matched = this.commands.get(commandName.toLowerCase());
    if (matched) {
      return matched;
    }
    return new CommandBuilder(commandName);
  }

  translateParams(params: readonly CommandParam[], cmd?: Command, cmdBuilder?: CommandBuilder): CommandParam[] {
    const result: CommandParam[] = [];
    const dummyCmd = cmd ?? ({ params } as unknown as Command);

    for (const p of params) {
      if (!p.isFlag || !p.name) {
        result.push(p);
        continue;
      }

      const flagName = p.name.toLowerCase();

      // 1. Check command-scoped drop
      if (cmdBuilder?.isFlagDropped(flagName)) {
        continue;
      }

      // 2. Check command-scoped flag converter
      const cmdConverter = cmdBuilder?.getFlagConverter(flagName);
      if (cmdConverter) {
        const converted = cmdConverter(p.value, dummyCmd);
        result.push(...parseConvertedResult(converted));
        continue;
      }

      // 3. Check global drop
      if (this.globalDroppedFlags.has(flagName)) {
        continue;
      }

      // 4. Check global flag converter
      const globalConverter = this.globalFlagConverters.get(flagName);
      if (globalConverter) {
        const converted = globalConverter(p.value, dummyCmd);
        result.push(...parseConvertedResult(converted));
        continue;
      }

      // 5. Passthrough
      result.push(p);
    }

    return result;
  }

  async convert(command: Command, partialCtx?: Partial<ConversionContext>): Promise<ConversionResult> {
    const ctx: ConversionContext = {
      cwd: partialCtx?.cwd ?? process.cwd(),
      env: partialCtx?.env ?? process.env,
      npmVersion: partialCtx?.npmVersion ?? TARGET_NPM.targetVersion,
      pnpmVersion: partialCtx?.pnpmVersion ?? TARGET_PNPM.targetVersion,
    };

    const cmdBuilder = this.getCommand(command.name);
    const translate = (c: Command) => this.translateParams(c.params, c, cmdBuilder);

    if (cmdBuilder) {
      const handler = cmdBuilder.getHandler();
      if (handler) {
        return handler(command, ctx, translate);
      }

      const translatedParams = translate(command);
      const pnpmCommand = command
        .withPM(PackageManager.PNPM)
        .withName(cmdBuilder.targetName)
        .withParams(translatedParams);

      return {
        type: 'pnpm',
        command: pnpmCommand,
      };
    }

    // Undefined command -> Passthrough with global flag translations
    const translatedParams = this.translateParams(command.params, command);
    const pnpmCommand = command.withPM(PackageManager.PNPM).withName(command.name).withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }

  static createDefault(): ConverterRegistry {
    return configureDefaultRegistry(new ConverterRegistry());
  }
}
