import type { Command } from './command.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';

export interface CommandConverter {
  readonly commandNames: readonly string[];
  convert(command: Command, ctx: ConversionContext): Promise<ConversionResult> | ConversionResult;
}
