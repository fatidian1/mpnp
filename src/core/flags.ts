import type { CommandParam } from './param.js';
import type { Command } from './command.js';
import { ConverterRegistry } from './registry.js';

let defaultRegistryInstance: ConverterRegistry | undefined;

function getDefaultRegistry(): ConverterRegistry {
  if (!defaultRegistryInstance) {
    defaultRegistryInstance = ConverterRegistry.createDefault();
  }
  return defaultRegistryInstance;
}

export function translateCommonFlags(params: readonly CommandParam[], cmd?: Command): CommandParam[] {
  return getDefaultRegistry().translateParams(params, cmd);
}
