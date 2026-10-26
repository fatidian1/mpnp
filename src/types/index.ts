import type { Command } from '../core/command.js';

export enum PackageManager {
  NPM = 'npm',
  PNPM = 'pnpm',
}

export enum ParamKind {
  Positional = 'positional',
  LongFlag = 'long-flag',
  ShortFlag = 'short-flag',
  EndOfFlags = 'end-of-flags',
}

export interface ExecutionContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;
  dryRun?: boolean;
}

export interface ConversionContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  npmVersion: string;
  pnpmVersion: string;
}

export interface PostAction {
  readonly description: string;
  run(ctx: ExecutionContext): Promise<void>;
}

export type ConversionResult =
  | {
      readonly type: 'pnpm';
      readonly command: Command;
      readonly postActions?: readonly PostAction[];
    }
  | {
      readonly type: 'custom';
      readonly description: string;
      readonly handler: (ctx: ExecutionContext) => Promise<number | void>;
    }
  | {
      readonly type: 'noop';
      readonly exitCode?: number;
    };
