import packageJson from '../../package.json' with { type: 'json' };
export interface CompatibilityTarget {
  readonly name: string;
  readonly targetVersion: string;
  readonly supportedRange: string;
  readonly notes: string;
}

export const TARGET_NPM: CompatibilityTarget = {
  name: 'npm',
  targetVersion: '12.2.1',
  supportedRange: '>=10.0.0 <=12.x',
  notes:
    'Tailored for latest npm 12.x CLI specification and behavior (including workspaces, remote tarball packaging, native patch, approve-scripts, and pkg commands).',
};

export const TARGET_PNPM: CompatibilityTarget = {
  name: 'pnpm',
  targetVersion: packageJson.devEngines.packageManager.version,
  supportedRange: '>=10.0.0 <=12.x',
  notes:
    'Optimized for high-performance pnpm 12.x (Rust engine) with recursive workspace filters, native pack, and lockfile semantics.',
};

export const MPNP_VERSION: string = packageJson.version;
