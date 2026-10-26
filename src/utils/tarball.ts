import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface RemoteTarballResult {
  filename: string;
  filepath: string;
  version: string;
  packageName: string;
  tarballUrl: string;
  sizeBytes: number;
}

export interface FetchTarballOptions {
  spec: string;
  destinationDir?: string;
  registry?: string;
  dryRun?: boolean;
}

export function parsePackageSpec(spec: string): { name: string; versionSpec: string } {
  // Handles:
  // 'lodash' -> name: 'lodash', version: 'latest'
  // 'lodash@4.17.21' -> name: 'lodash', version: '4.17.21'
  // '@types/node' -> name: '@types/node', version: 'latest'
  // '@types/node@20.0.0' -> name: '@types/node', version: '20.0.0'
  if (spec.startsWith('@')) {
    const secondAt = spec.indexOf('@', 1);
    if (secondAt !== -1) {
      return {
        name: spec.slice(0, secondAt),
        versionSpec: spec.slice(secondAt + 1) || 'latest',
      };
    }
    return { name: spec, versionSpec: 'latest' };
  }

  const atIndex = spec.indexOf('@');
  if (atIndex !== -1) {
    return {
      name: spec.slice(0, atIndex),
      versionSpec: spec.slice(atIndex + 1) || 'latest',
    };
  }

  return { name: spec, versionSpec: 'latest' };
}

export async function fetchRemoteTarball(options: FetchTarballOptions): Promise<RemoteTarballResult> {
  const { spec, destinationDir = process.cwd(), dryRun = false } = options;
  const registry = (options.registry || 'https://registry.npmjs.org/').replace(/\/+$/, '');
  const { name, versionSpec } = parsePackageSpec(spec);

  // Registry URL: for scoped packages e.g. @types/node -> https://registry.npmjs.org/@types%2Fnode
  const encodedName = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);
  const metadataUrl = `${registry}/${encodedName}`;

  const res = await fetch(metadataUrl, {
    headers: {
      Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch package metadata for "${spec}" from ${metadataUrl}: HTTP ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as {
    'dist-tags'?: Record<string, string>;
    versions?: Record<string, { dist?: { tarball?: string; unpackedSize?: number } }>;
  };

  const distTags = data['dist-tags'] || {};
  const versions = data.versions || {};

  let targetVersion: string;
  if (distTags[versionSpec]) {
    targetVersion = distTags[versionSpec];
  } else if (versions[versionSpec]) {
    targetVersion = versionSpec;
  } else {
    // If exact match not found, take latest tag or highest available version
    targetVersion = distTags['latest'] || Object.keys(versions).pop() || versionSpec;
  }

  const versionData = versions[targetVersion];
  const tarballUrl = versionData?.dist?.tarball;
  if (!tarballUrl) {
    throw new Error(`Tarball URL not found for package "${name}@${targetVersion}" in registry metadata.`);
  }

  // Tarball filename: e.g. lodash-4.17.21.tgz or scope-pkg-1.0.0.tgz
  const cleanPackageName = name.replace(/^@/, '').replace('/', '-');
  const filename = `${cleanPackageName}-${targetVersion}.tgz`;
  const destPath = resolve(destinationDir, filename);

  if (dryRun) {
    return {
      filename,
      filepath: destPath,
      version: targetVersion,
      packageName: name,
      tarballUrl,
      sizeBytes: versionData?.dist?.unpackedSize ?? 0,
    };
  }

  const tarballRes = await fetch(tarballUrl);
  if (!tarballRes.ok) {
    throw new Error(
      `Failed to download tarball from ${tarballUrl}: HTTP ${tarballRes.status} ${tarballRes.statusText}`
    );
  }

  const arrayBuffer = await tarballRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await mkdir(destinationDir, { recursive: true });
  await writeFile(destPath, buffer);

  return {
    filename,
    filepath: destPath,
    version: targetVersion,
    packageName: name,
    tarballUrl,
    sizeBytes: buffer.length,
  };
}
