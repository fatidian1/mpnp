import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/core/parser.js';
import { ConverterRegistry } from '../src/core/registry.js';
import { executeResult } from '../src/core/executor.js';

describe('New Specs and Fixes (Review & Compatibility)', () => {
  const registry = ConverterRegistry.createDefault();
  const silentOpts = {
    stdout: { write: () => true } as unknown as NodeJS.WriteStream,
    stderr: { write: () => true } as unknown as NodeJS.WriteStream,
    dryRun: true,
  };

  describe('prefix bug fix', () => {
    it('preserves prefix command without mapping to root', async () => {
      const cmd = parseArgs(['prefix']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.name).toBe('prefix');
        expect(result.command.toString()).toBe('pnpm prefix');
      }
    });

    it('preserves root and bin commands', async () => {
      const rootCmd = parseArgs(['root']);
      const rootRes = await registry.convert(rootCmd);
      if (rootRes.type === 'pnpm') {
        expect(rootRes.command.name).toBe('root');
      }

      const binCmd = parseArgs(['bin']);
      const binRes = await registry.convert(binCmd);
      if (binRes.type === 'pnpm') {
        expect(binRes.command.name).toBe('bin');
      }
    });
  });

  describe('npm diff -> git diff', () => {
    it('translates npm diff to git diff custom runner', async () => {
      const cmd = parseArgs(['diff']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('git diff');
    });

    it('translates npm diff flags like --diff-name-only to git diff --name-only', async () => {
      const cmd = parseArgs(['diff', '--diff-name-only']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toBe('git diff --name-only');
    });

    it('forwards --diff value to git diff', async () => {
      const cmd = parseArgs(['diff', '--diff=HEAD~1']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toBe('git diff HEAD~1');
    });
  });

  describe('npm edit -> pnpm patch', () => {
    it('returns error when package is not provided', async () => {
      const cmd = parseArgs(['edit']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, silentOpts);
      expect(exitCode).toBe(1);
    });

    it('creates custom handler for package edit with pnpm patch', async () => {
      const cmd = parseArgs(['edit', 'lodash']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Edit package lodash using pnpm patch');
    });
  });

  describe('npm exec / x', () => {
    it('translates exec to custom handler', async () => {
      const cmd = parseArgs(['exec', 'cowsay', 'hello']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
    });

    it('translates alias x to custom handler', async () => {
      const cmd = parseArgs(['x', 'vitest']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
    });
  });

  describe('npm explore', () => {
    it('translates npm explore <pkg> to custom handler', async () => {
      const cmd = parseArgs(['explore', 'vitest']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Explore package vitest');
    });

    it('fails when package name is omitted', async () => {
      const cmd = parseArgs(['explore']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, silentOpts);
      expect(exitCode).toBe(1);
    });
  });

  describe('npm install-scripts (approve, deny, ls, prune)', () => {
    it('translates install-scripts approve <pkg> to pnpm approve-builds <pkg>', async () => {
      const cmd = parseArgs(['install-scripts', 'approve', 'esbuild']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds esbuild');
      }
    });

    it('translates install-scripts deny <pkg> to pnpm approve-builds !<pkg>', async () => {
      const cmd = parseArgs(['install-scripts', 'deny', 'malicious']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm approve-builds !malicious');
      }
    });

    it('translates install-scripts ls and prune', async () => {
      const lsCmd = parseArgs(['install-scripts', 'ls']);
      const lsRes = await registry.convert(lsCmd);
      if (lsRes.type === 'pnpm') {
        expect(lsRes.command.toString()).toBe('pnpm approve-builds');
      }

      const pruneCmd = parseArgs(['install-scripts', 'prune']);
      const pruneRes = await registry.convert(pruneCmd);
      if (pruneRes.type === 'pnpm') {
        expect(pruneRes.command.toString()).toBe('pnpm approve-builds');
      }
    });
  });

  describe('npm install-test & install-ci-test', () => {
    it('translates install-test without packages to pnpm install-test', async () => {
      const cmd = parseArgs(['install-test']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm install-test');
      }
    });

    it('translates install-test with packages to composite add + test', async () => {
      const cmd = parseArgs(['install-test', 'lodash', '-D']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Run pnpm add for packages followed by pnpm test');
    });

    it('translates alias it with packages to composite add + test', async () => {
      const cmd = parseArgs(['it', 'axios']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
    });

    it('translates install-ci-test and cit to composite ci + test', async () => {
      const cmd = parseArgs(['install-ci-test']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Run pnpm ci followed by pnpm test');

      const citCmd = parseArgs(['cit']);
      const citRes = await registry.convert(citCmd);
      expect(citRes.type).toBe('custom');
    });
  });

  describe('npm version', () => {
    it('translates npm version without args to JSON output custom handler', async () => {
      const cmd = parseArgs(['version']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Display project and environment versions JSON');
    });

    it('translates npm version patch to pnpm version patch with flag translation', async () => {
      const cmd = parseArgs(['version', 'patch', '-w', 'my-pkg']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm version patch --filter=my-pkg');
      }
    });
  });

  describe('npm query', () => {
    it('translates npm query :root to custom handler', async () => {
      const cmd = parseArgs(['query', ':root']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      expect(result.description).toContain('Query dependency tree');
    });

    it('executes npm query vitest successfully and parses json without errors', async () => {
      let output = '';
      const mockStdout = {
        write: (chunk: string) => {
          output += chunk;
          return true;
        },
      } as unknown as NodeJS.WriteStream;

      const cmd = parseArgs(['query', 'vitest']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, { stdout: mockStdout });
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].name).toBe('vitest');
    });
  });

  describe('npm sbom', () => {
    it('automatically ensures --sbom-format=spdx when no format flag given', async () => {
      const cmd = parseArgs(['sbom']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm sbom --sbom-format=spdx');
      }
    });

    it('translates npm --sbom-type=cyclonedx to pnpm --sbom-format=cyclonedx', async () => {
      const cmd = parseArgs(['sbom', '--sbom-type=cyclonedx']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('pnpm');
      if (result.type === 'pnpm') {
        expect(result.command.toString()).toBe('pnpm sbom --sbom-format=cyclonedx');
      }
    });
  });

  describe('unsupported fast-fail (trust, org, help-search)', () => {
    it('rejects npm trust with code 1 instead of running /usr/bin/trust', async () => {
      const cmd = parseArgs(['trust', 'github']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, silentOpts);
      expect(exitCode).toBe(1);
    });

    it('rejects npm org with code 1', async () => {
      const cmd = parseArgs(['org', 'ls', 'myorg']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, silentOpts);
      expect(exitCode).toBe(1);
    });

    it('rejects npm help-search with code 1', async () => {
      const cmd = parseArgs(['help-search', 'install']);
      const result = await registry.convert(cmd);
      expect(result.type).toBe('custom');
      const exitCode = await executeResult(result, silentOpts);
      expect(exitCode).toBe(1);
    });
  });

  describe('npm aliases coverage', () => {
    it('covers all standard aliases', async () => {
      expect(registry.has('author')).toBe(true);
      expect(registry.has('home')).toBe(true);
      expect(registry.has('issues')).toBe(true);
      expect(registry.has('ln')).toBe(true);
      expect(registry.has('rb')).toBe(true);
      expect(registry.has('c')).toBe(true);
      expect(registry.has('u')).toBe(true);
      expect(registry.has('udpate')).toBe(true);
      expect(registry.has('dist-tags')).toBe(true);
      expect(registry.has('hlep')).toBe(true);
      expect(registry.has('isntal')).toBe(true);
      expect(registry.has('verison')).toBe(true);
      expect(registry.has('rum')).toBe(true);
      expect(registry.has('urn')).toBe(true);
      expect(registry.has('install-clean')).toBe(true);
      expect(registry.has('isntall-clean')).toBe(true);
      expect(registry.has('clean-install-test')).toBe(true);
      expect(registry.has('sit')).toBe(true);
    });
  });
});
