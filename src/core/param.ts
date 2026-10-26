import { ParamKind } from '../types/index.js';

export interface CommandParamProps {
  kind: ParamKind;
  raw: string;
  name?: string;
  value?: string;
}

export class CommandParam {
  readonly kind: ParamKind;
  readonly raw: string;
  readonly name?: string;
  readonly value?: string;

  constructor(props: CommandParamProps) {
    this.kind = props.kind;
    this.raw = props.raw;
    this.name = props.name;
    this.value = props.value;
  }

  get isFlag(): boolean {
    return this.kind === ParamKind.LongFlag || this.kind === ParamKind.ShortFlag;
  }

  get isPositional(): boolean {
    return this.kind === ParamKind.Positional;
  }

  get isEndOfFlags(): boolean {
    return this.kind === ParamKind.EndOfFlags;
  }

  matchesName(...names: string[]): boolean {
    if (!this.name) {
      return false;
    }
    return names.includes(this.name);
  }

  toArgString(): string {
    if (this.kind === ParamKind.Positional) {
      return this.raw;
    }
    if (this.kind === ParamKind.EndOfFlags) {
      return '--';
    }
    const prefix = this.kind === ParamKind.LongFlag ? '--' : '-';
    if (this.value !== undefined) {
      return `${prefix}${this.name}=${this.value}`;
    }
    return `${prefix}${this.name}`;
  }

  clone(overrides?: Partial<CommandParamProps>): CommandParam {
    return new CommandParam({
      kind: overrides?.kind ?? this.kind,
      raw: overrides?.raw ?? this.raw,
      name: overrides?.name ?? this.name,
      value: overrides?.value !== undefined ? overrides.value : this.value,
    });
  }

  static positional(value: string): CommandParam {
    return new CommandParam({
      kind: ParamKind.Positional,
      raw: value,
    });
  }

  static longFlag(name: string, value?: string): CommandParam {
    const raw = value !== undefined ? `--${name}=${value}` : `--${name}`;
    return new CommandParam({
      kind: ParamKind.LongFlag,
      raw,
      name,
      value,
    });
  }

  static shortFlag(name: string, value?: string): CommandParam {
    const raw = value !== undefined ? `-${name}=${value}` : `-${name}`;
    return new CommandParam({
      kind: ParamKind.ShortFlag,
      raw,
      name,
      value,
    });
  }

  static endOfFlags(): CommandParam {
    return new CommandParam({
      kind: ParamKind.EndOfFlags,
      raw: '--',
    });
  }
}
