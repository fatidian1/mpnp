import packageJson from '../../package.json' with { type: 'json' };
export interface CompatibilityTarget {
  readonly name: string;
  readonly targetVersion: string;
  readonly supportedRange: string;
}

export const TARGET_NPM: CompatibilityTarget = {
  name: 'npm',
  targetVersion: packageJson.devEngines.npm,
  supportedRange: packageJson.devEngines.npm,
};

export const TARGET_PNPM: CompatibilityTarget = {
  name: 'pnpm',
  targetVersion: packageJson.packageManager.replace(/^pnpm@/, ''),
  supportedRange: packageJson.engines.pnpm,
};

export const MPNP_VERSION: string = packageJson.version;
