import { parseArgs } from '../core/parser.js';
import { ConverterRegistry } from '../core/registry.js';
import { executeResult } from '../core/executor.js';
import { PackageManager } from '../types/index.js';

async function run(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const command = parseArgs(rawArgs, PackageManager.NPM);
  const registry = ConverterRegistry.createDefault();

  const result = await registry.convert(command);
  const dryRun = Boolean(process.env.MPNP_DRY_RUN);
  const exitCode = await executeResult(result, { dryRun });
  process.exit(exitCode);
}

run().catch((err) => {
  process.stderr.write(`mpnp error: ${(err as Error).message}\n`);
  process.exit(1);
});
