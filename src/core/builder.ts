import { PackageManager } from '../types/index.js';
import type { Command } from './command.js';
import { CommandParam } from './param.js';
import type { CommandConverter } from './converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export type FlagConverterCallback = (
  value: string | undefined,
  cmd: Command
) => string | string[] | CommandParam | CommandParam[];

export type CommandHandler = (
  cmd: Command,
  ctx: ConversionContext,
  translate: (cmd: Command) => CommandParam[]
) => Promise<ConversionResult> | ConversionResult;

export function parseParamString(str: string): CommandParam {
  if (str === '--') {
    return CommandParam.endOfFlags();
  }
  if (str.startsWith('--')) {
    const eqIdx = str.indexOf('=');
    if (eqIdx !== -1) {
      return CommandParam.longFlag(str.slice(2, eqIdx), str.slice(eqIdx + 1));
    }
    return CommandParam.longFlag(str.slice(2));
  }
  if (str.startsWith('-') && str.length > 1) {
    const eqIdx = str.indexOf('=');
    if (eqIdx !== -1) {
      return CommandParam.shortFlag(str.slice(1, eqIdx), str.slice(eqIdx + 1));
    }
    return CommandParam.shortFlag(str.slice(1));
  }
  return CommandParam.positional(str);
}

export function parseConvertedResult(result: string | string[] | CommandParam | CommandParam[]): CommandParam[] {
  if (Array.isArray(result)) {
    return result.flatMap((r) => (typeof r === 'string' ? parseConvertedResult(r) : [r]));
  }
  if (typeof result !== 'string') {
    return [result];
  }
  return [parseParamString(result)];
}

export class CommandBuilder implements CommandConverter {
  readonly commandNames: readonly string[];
  targetName: string;
  private readonly flagConverters = new Map<string, FlagConverterCallback>();
  private readonly droppedFlags = new Set<string>();
  private customHandler?: CommandHandler;

  constructor(names: string | string[], target?: string) {
    const list = Array.isArray(names) ? names : [names];
    this.commandNames = list;
    this.targetName = target ?? list[0];
  }

  target(target: string): this {
    this.targetName = target;
    return this;
  }

  flag(names: string | string[], converter: FlagConverterCallback): this {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      this.flagConverters.set(name.toLowerCase(), converter);
    }
    return this;
  }

  dropFlag(...names: string[]): this {
    for (const name of names) {
      this.droppedFlags.add(name.toLowerCase());
    }
    return this;
  }

  handle(handler: CommandHandler): this {
    this.customHandler = handler;
    return this;
  }

  getFlagConverter(name: string): FlagConverterCallback | undefined {
    return this.flagConverters.get(name.toLowerCase());
  }

  isFlagDropped(name: string): boolean {
    return this.droppedFlags.has(name.toLowerCase());
  }

  getHandler(): CommandHandler | undefined {
    return this.customHandler;
  }

  convert(command: Command, ctx: ConversionContext): Promise<ConversionResult> | ConversionResult {
    if (this.customHandler) {
      return this.customHandler(command, ctx, (c) => c.params as CommandParam[]);
    }
    return {
      type: 'pnpm',
      command: command.withPM(PackageManager.PNPM).withName(this.targetName),
    };
  }
}
