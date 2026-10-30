import packageJson from '../../package.json' with { type: 'json' };
export interface CompatibilityTarget {
  readonly name: string;
  readonly targetVersion: string;
  readonly supportedRange: string;
}

export const TARGET_NPM: CompatibilityTarget = {
  name: 'npm',
  targetVersion: '12.2.1',
  supportedRange: packageJson.engines.npm,
};

export const TARGET_PNPM: CompatibilityTarget = {
  name: 'pnpm',
  targetVersion: packageJson.packageManager.replace(/^pnpm@/, ''),
  supportedRange: packageJson.engines.pnpm,
};

export const MPNP_VERSION: string = packageJson.version;
