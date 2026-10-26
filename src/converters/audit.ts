import { PackageManager } from '../types/index.js';
import type { Command } from '../core/command.js';
import type { CommandConverter } from '../core/converter.js';
import type { ConversionContext, ConversionResult } from '../types/index.js';
import { translateCommonFlags } from '../core/flags.js';
import { CommandParam } from '../core/param.js';

export class AuditConverter implements CommandConverter {
  readonly commandNames: readonly string[] = ['audit'];

  convert(command: Command, _ctx: ConversionContext): ConversionResult {
    const positionals = command.getPositionals();
    const hasFix = positionals.includes('fix');

    // Filter out 'fix' from positionals
    const filteredParams = command.params.filter((p) => !(p.isPositional && p.raw === 'fix'));

    const translatedParams = translateCommonFlags(filteredParams);

    if (hasFix && !translatedParams.some((p) => p.matchesName('fix'))) {
      translatedParams.push(CommandParam.longFlag('fix'));
    }

    const pnpmCommand = command.withPM(PackageManager.PNPM).withName('audit').withParams(translatedParams);

    return {
      type: 'pnpm',
      command: pnpmCommand,
    };
  }
}
