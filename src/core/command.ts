import { PackageManager } from '../types/index.js';
import { CommandParam } from './param.js';

export interface CommandProps {
  pm: PackageManager;
  name: string;
  params?: readonly CommandParam[];
  rawTokens?: readonly string[];
}

export class Command {
  readonly pm: PackageManager;
  readonly name: string;
  readonly params: readonly CommandParam[];
  readonly rawTokens: readonly string[];

  constructor(props: CommandProps) {
    this.pm = props.pm;
    this.name = props.name;
    this.params = props.params ? [...props.params] : [];
    this.rawTokens = props.rawTokens ? [...props.rawTokens] : [];
  }

  hasFlag(...names: string[]): boolean {
    return this.params.some((p) => p.isFlag && p.matchesName(...names));
  }

  getFlag(...names: string[]): CommandParam | undefined {
    return this.params.find((p) => p.isFlag && p.matchesName(...names));
  }

  getFlagValue(...names: string[]): string | undefined {
    const flag = this.getFlag(...names);
    return flag?.value;
  }

  getPositionals(): string[] {
    return this.params.filter((p) => p.isPositional).map((p) => p.raw);
  }

  getPositionalParams(): CommandParam[] {
    return this.params.filter((p) => p.isPositional);
  }

  getFlagParams(): CommandParam[] {
    return this.params.filter((p) => p.isFlag);
  }

  withName(name: string): Command {
    return new Command({
      pm: this.pm,
      name,
      params: this.params,
      rawTokens: this.rawTokens,
    });
  }

  withPM(pm: PackageManager): Command {
    return new Command({
      pm,
      name: this.name,
      params: this.params,
      rawTokens: this.rawTokens,
    });
  }

  withParams(params: readonly CommandParam[]): Command {
    return new Command({
      pm: this.pm,
      name: this.name,
      params,
      rawTokens: this.rawTokens,
    });
  }

  withoutFlags(...flagNames: string[]): Command {
    const nextParams = this.params.filter((p) => !p.isFlag || !p.matchesName(...flagNames));
    return this.withParams(nextParams);
  }

  replaceFlag(oldName: string, newParam: CommandParam | null): Command {
    const nextParams: CommandParam[] = [];
    let replaced = false;

    for (const p of this.params) {
      if (p.isFlag && p.matchesName(oldName)) {
        if (newParam && !replaced) {
          nextParams.push(newParam);
          replaced = true;
        }
      } else {
        nextParams.push(p);
      }
    }

    if (!replaced && newParam) {
      nextParams.push(newParam);
    }

    return this.withParams(nextParams);
  }

  addParam(...params: CommandParam[]): Command {
    return this.withParams([...this.params, ...params]);
  }

  addPositional(value: string): Command {
    return this.addParam(CommandParam.positional(value));
  }

  addLongFlag(name: string, value?: string): Command {
    return this.addParam(CommandParam.longFlag(name, value));
  }

  addShortFlag(name: string, value?: string): Command {
    return this.addParam(CommandParam.shortFlag(name, value));
  }

  toArgs(): string[] {
    const args: string[] = [];
    if (this.name) {
      args.push(this.name);
    }
    for (const p of this.params) {
      args.push(p.toArgString());
    }
    return args;
  }

  toString(): string {
    const cmd = `${this.pm} ${this.toArgs().join(' ')}`.trim();
    return cmd;
  }
}
