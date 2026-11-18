import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

const UNSUPPORTED_REASONS: Record<string, string> = {
  trust:
    'npm trust (OIDC provider configuration for npmjs.org) is an npm-registry-specific protocol not implemented in pnpm CLI.',
  org: 'npm org (organization management on npmjs.com) is not supported by pnpm CLI. Use web interface or official npm CLI.',
  ogr: 'npm org (organization management on npmjs.com) is not supported by pnpm CLI. Use web interface or official npm CLI.',
  'help-search':
    'npm help-search (markdown documentation search) is not applicable to pnpm. Use "pnpm --help" or https://pnpm.io.',
};

export function handleUnsupported(command: Command, _ctx: ConversionContext): ConversionResult {
  const reason =
    UNSUPPORTED_REASONS[command.name.toLowerCase()] ??
    `Command 'npm ${command.name}' is not supported in pnpm environments.`;

  return {
    type: 'custom',
    description: `Unsupported command: npm ${command.name}`,
    handler: async (execCtx: ExecutionContext) => {
      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] npm ${command.name} (unsupported)\n`);
        return 1;
      }

      execCtx.stderr.write(`mpnp error: ${reason}\n`);
      return 1;
    },
  };
}
