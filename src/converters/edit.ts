import { spawn } from 'node:child_process';
import type { Command } from '../core/command.js';
import type { ConversionContext, ConversionResult, ExecutionContext } from '../types/index.js';

export function handleEdit(command: Command, _ctx: ConversionContext): ConversionResult {
  const positionals = command.getPositionals();

  if (positionals.length === 0) {
    return {
      type: 'custom',
      description: 'npm edit requires a package argument',
      handler: async (execCtx: ExecutionContext) => {
        execCtx.stderr.write('Usage: npm edit <pkg>[/<subpkg>...]\n');
        return 1;
      },
    };
  }

  const pkgName = positionals[0];

  return {
    type: 'custom',
    description: `Edit package ${pkgName} using pnpm patch`,
    handler: async (execCtx: ExecutionContext) => {
      if (execCtx.dryRun) {
        execCtx.stdout.write(`[mpnp dry-run] pnpm patch ${pkgName} -> open in $EDITOR\n`);
        return 0;
      }

      // Step 1: Run pnpm patch <pkgName> and capture output to find temporary directory
      const patchProcess = spawn('pnpm', ['patch', pkgName], {
        cwd: execCtx.cwd,
        env: execCtx.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      patchProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      patchProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      const patchCode = await new Promise<number>((resolve) => {
        patchProcess.on('close', (code) => resolve(code ?? 0));
        patchProcess.on('error', (err) => {
          execCtx.stderr.write(`Failed to start pnpm patch: ${err.message}\n`);
          resolve(1);
        });
      });

      if (patchCode !== 0) {
        execCtx.stderr.write(stderr || stdout || `pnpm patch failed with exit code ${patchCode}\n`);
        return patchCode;
      }

      // Step 2: Extract edit directory path from pnpm patch output
      const match = stdout.match(/edit the package at:\s*\n\s*([^\n\r]+)/i);
      const patchDir = match?.[1]?.trim();

      if (!patchDir) {
        execCtx.stderr.write(`Could not extract patch directory from pnpm patch output:\n${stdout}\n`);
        return 1;
      }

      // Step 3: Launch user's configured editor
      const rawEditor = execCtx.env.EDITOR || execCtx.env.VISUAL || 'vi';
      const [editorBin, ...editorArgs] = rawEditor.split(/\s+/);

      execCtx.stdout.write(`Opening ${patchDir} in ${editorBin}...\n`);

      const editorExitCode = await new Promise<number>((resolve) => {
        const editorProcess = spawn(editorBin, [...editorArgs, patchDir], {
          cwd: patchDir,
          env: execCtx.env,
          stdio: 'inherit',
        });

        editorProcess.on('error', (err) => {
          execCtx.stderr.write(`Failed to launch editor ${editorBin}: ${err.message}\n`);
          resolve(1);
        });

        editorProcess.on('close', (code) => {
          resolve(code ?? 0);
        });
      });

      if (editorExitCode !== 0) {
        execCtx.stderr.write(`Editor process exited with code ${editorExitCode}\n`);
        return editorExitCode;
      }

      execCtx.stdout.write(
        `\nFinished editing ${pkgName}.\nTo commit changes, run:\n  pnpm patch-commit '${patchDir}'\n`
      );

      return 0;
    },
  };
}
