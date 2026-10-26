# mpnp (NPM to PNPM CLI Bridge)

`mpnp` is a high-performance CLI bridge that translates `npm` commands and flags into their exact `pnpm` equivalents. It lets developers and automated scripts keep using familiar `npm` commands (per the official npm documentation) while leveraging the underlying speed, hard-linked store, and workspace engine of `pnpm`.

The project is built entirely in TypeScript (Node.js ESM) with strict typing, modular command converters, zero runtime dependencies, and instant builds powered by [`tsdown`](https://github.com/rolldown/tsdown) (Rolldown in Rust).

---

## 🎯 Target Compatibility Versions

Converters and CLI behaviors are tailored to the latest releases of `npm` and `pnpm`:

| Tool     | Target Version | Supported Range   | Architectural Notes                                                                                                   |
| :------- | :------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **npm**  | `12.2.1`       | `>=10.0.0 <=12.x` | Standard npm CLI specification (workspaces, remote tarball packaging, native patch, approve-scripts, `pkg` commands). |
| **pnpm** | `12.15.0`      | `>=10.0.0 <=12.x` | High-performance Rust-powered pnpm 12 engine with recursive workspace filters (`--filter`, `-r`), frozen lockfile.    |

Compatibility targets are defined in [src/config/versions.ts](src/config/versions.ts).

---

## 📊 Command Coverage Matrix

The primary focus of this tool is dependency management, scripts execution, and project lifecycle commands.

| npm Command           | npm Aliases                                           | pnpm Target                               |    Coverage     | Key Differences & mpnp Handling                                                                                                                                                                                                                                                                     |
| :-------------------- | :---------------------------------------------------- | :---------------------------------------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`         | `i`, `add`, `isntall`, `in`                           | `pnpm install` / `pnpm add`               | **Full (100%)** | When packages are passed (`npm i lodash`), translates to `pnpm add lodash`. Without packages (`npm i`), executes `pnpm install`. Translates flags: `-D`, `-O`, `-P`, `-E`, `-w`, `-ws`, `--legacy-peer-deps`.                                                                                       |
| `npm ci`              | `clean-install`, `ic`                                 | `pnpm install --frozen-lockfile`          | **Full (100%)** | Ensures clean installation strictly adhering to lockfile without updating it.                                                                                                                                                                                                                       |
| `npm uninstall`       | `unlink`, `rm`, `r`, `remove`, `un`                   | `pnpm remove` / `pnpm unlink`             | **Full (100%)** | `npm rm <pkg>` -> `pnpm remove <pkg>`. Standalone `npm unlink` (without arguments) unlinks the current project (`pnpm unlink`).                                                                                                                                                                     |
| `npm update`          | `up`, `upgrade`                                       | `pnpm update`                             | **Full (100%)** | Translates flags `-g`, `-D`, `-w` -> `--filter`, `-ws` -> `-r`.                                                                                                                                                                                                                                     |
| `npm outdated`        | _(none)_                                              | `pnpm outdated`                           | **Full (100%)** | Forwards inspection parameters (`--long`, `-g`, `--json`).                                                                                                                                                                                                                                          |
| `npm audit`           | _(none)_                                              | `pnpm audit` / `pnpm audit --fix`         | **Full (100%)** | Automatically maps `npm audit fix` to `pnpm audit --fix`.                                                                                                                                                                                                                                           |
| `npm prune`           | _(none)_                                              | `pnpm prune`                              | **Full (100%)** | Supports `--production` / `--omit=dev` -> `--prod`.                                                                                                                                                                                                                                                 |
| `npm dedupe`          | `find-dupes`, `ddp`                                   | `pnpm dedupe`                             | **Full (100%)** | Optimizes dependency graph and deduplicates packages in lockfile.                                                                                                                                                                                                                                   |
| `npm list`            | `ls`, `ll`, `la`                                      | `pnpm list` / `pnpm list --long`          | **Full (100%)** | `npm ls --all` -> `pnpm list --depth Infinity`. `ll`/`la` enable `--long` format.                                                                                                                                                                                                                   |
| `npm explain`         | `why`                                                 | `pnpm why`                                | **Full (100%)** | Inspects why a specific package exists in the dependency tree.                                                                                                                                                                                                                                      |
| `npm pack`            | _(none)_                                              | **Custom Registry Fetcher** / `pnpm pack` | **Full (100%)** | **Critical edge-case:** `pnpm pack lodash` fails because pnpm only packs local directories. `mpnp` detects remote package specifiers, fetches package metadata from npm registry, and downloads `${pkg}-${version}.tgz` to cwd or `--pack-destination`. Local targets are forwarded to `pnpm pack`. |
| `npm init`            | `create`, `innit`                                     | `pnpm init` / `pnpm create`               | **Full (100%)** | `npm init <starter>` -> `pnpm create <starter>`. Also handles `npm init --scope=<org>` (runs `pnpm init` and executes a `PostAction` setting `"name": "@<org>/<clean-name>"` in `package.json`).                                                                                                    |
| `npm pkg`             | _(none)_                                              | `pnpm pkg`                                | **Full (100%)** | Full support for subcommands: `get`, `set`, `delete`.                                                                                                                                                                                                                                               |
| `npm link`            | _(none)_                                              | `pnpm link` / `pnpm link --global`        | **Full (100%)** | `npm link` (without arguments) -> `pnpm link --global`. `npm link <pkg>` -> `pnpm link <pkg>`.                                                                                                                                                                                                      |
| `npm root`            | `prefix`, `bin`                                       | `pnpm root` / `pnpm bin`                  | **Full (100%)** | Resolves `node_modules` path and binary directories (locally and with `-g`).                                                                                                                                                                                                                        |
| `npm run`             | `run-script`, `test`, `t`, `start`, `stop`, `restart` | `pnpm run` / `pnpm test` / etc.           | **Full (100%)** | Forwards script arguments after `--`, maps shortcuts (`t`, `start`, `stop`, `restart`).                                                                                                                                                                                                             |
| `npm exec` / `npx`    | _(none)_                                              | `pnpm exec` / `pnpm dlx`                  | **Full (100%)** | Executes local package binaries or runs one-off packages via `pnpm dlx`.                                                                                                                                                                                                                            |
| `npm patch`           | `patch-commit`                                        | `pnpm patch` / `pnpm patch-commit`        | **Full (100%)** | Native patching workflow: `npm patch <pkg>` / `npm patch add <pkg>` -> `pnpm patch <pkg>`, `npm patch commit <dir>` / `npm patch-commit <dir>` -> `pnpm patch-commit <dir>`.                                                                                                                        |
| `npm approve-scripts` | `deny-scripts`, `approve-builds`                      | `pnpm approve-builds`                     | **Full (100%)** | Script permission management introduced in npm 12: `approve-scripts` -> `pnpm approve-builds`, `deny-scripts <pkg>` -> `pnpm approve-builds !<pkg>`.                                                                                                                                                |
| `npm cache`           | _(none)_                                              | `pnpm store`                              | **High (90%)**  | `npm cache clean` -> `pnpm store prune`, `npm cache ls` -> `pnpm store status`.                                                                                                                                                                                                                     |
| _Other commands_      | _view, version, publish, ..._                         | `pnpm <command>`                          | **Passthrough** | Non-dependency commands pass through to `pnpm` with common flags translated.                                                                                                                                                                                                                        |

---

## 🔀 Flag Translation Matrix

| npm Flag                          | pnpm Flag                       | Description & Behavior                                               |
| :-------------------------------- | :------------------------------ | :------------------------------------------------------------------- |
| `-D`, `--save-dev`                | `-D`, `--save-dev`              | Save package to `devDependencies`                                    |
| `-P`, `--save-prod`               | `--save-prod`                   | Save package to `dependencies`                                       |
| `-O`, `--save-optional`           | `-O`, `--save-optional`         | Save package to `optionalDependencies`                               |
| `--save-peer`                     | `--save-peer`                   | Save package to `peerDependencies`                                   |
| `-E`, `--save-exact`              | `-E`                            | Save exact version without `^` or `~` prefixes                       |
| `-w <name>`, `--workspace=<name>` | `--filter <name>`               | Select specific workspace package in monorepo                        |
| `-ws`, `--workspaces`             | `-r`, `--recursive`             | Execute command recursively across all workspace packages            |
| `--package-lock-only`             | `--lockfile-only`               | Updates only lockfile without downloading packages to `node_modules` |
| `--legacy-peer-deps`              | `--no-strict-peer-dependencies` | Disables strict peer dependency resolution                           |
| `--production`, `--omit=dev`      | `--prod`                        | Exclude development dependencies                                     |
| `--omit=optional`                 | `--no-optional`                 | Exclude optional dependencies                                        |
| `--prefix <dir>`                  | `-C <dir>`                      | Set execution working directory                                      |
| `--all`, `-a` (in `ls`)           | `--depth=Infinity`              | Show full dependency tree without depth limits                       |
| `--pack-destination <dir>`        | `--pack-destination <dir>`      | Directory where the `.tgz` archive is saved                          |

---

## 🔍 Deep Dive: Special Handlers

### 1. `npm pack lodash` vs `pnpm pack`

- **Problem:** In npm, `npm pack lodash` downloads `lodash-x.y.z.tgz` directly from the npm registry into the current directory. In pnpm, `pnpm pack lodash` treats `lodash` as a local path and immediately crashes with `Cannot pack package: lodash is not a local directory`.
- **Solution in `mpnp`:** [src/converters/pack.ts](src/converters/pack.ts) checks whether the positional target is a local path (`./`, `../`, `/`, or an existing folder on disk) or a remote registry package specifier (`lodash`, `@types/node@^20.0.0`). When a remote package is requested, `mpnp` queries registry metadata, resolves the exact `dist.tarball` URL, downloads the `.tgz` file, and outputs the resulting filename to stdout just like npm.

### 2. `npm init --scope=<org>`

- **Problem:** `pnpm init` does not accept a `--scope` option.
- **Solution in `mpnp`:** [src/converters/init.ts](src/converters/init.ts) executes `pnpm init` and registers a `PostAction`. Upon successful creation, it safely loads `package.json` and updates `"name": "@<org>/<clean-name>"`.

### 3. `npm ci`

- Maps strictly to `pnpm install --frozen-lockfile` to enforce hermetic lockfile installs.

---

## 🏗️ Architecture & Module Organization

The codebase is split into modular layers:

```
src/
├── types/          # Domain types: PackageManager (npm/pnpm enum), ParamKind, ExecutionContext
├── core/
│   ├── param.ts    # CommandParam abstraction (flags, values, positionals)
│   ├── command.ts  # Command abstraction (immutable queries, mutations, serialization)
│   ├── parser.ts   # CLI argument tokenizer (handles =, space-separated values, and --)
│   ├── flags.ts    # Shared flag translation rules (npm -> pnpm)
│   ├── converter.ts# CommandConverter interface
│   ├── registry.ts # Converter registry with fallback support
│   └── executor.ts # Process executor (stdio: inherit, post-actions)
├── converters/     # Modular converters (isolated per command family)
│   ├── install.ts
│   ├── ci.ts
│   ├── uninstall.ts
│   ├── update.ts
│   ├── pack.ts     # Remote registry tarball & local package packing
│   ├── init.ts     # Initializer starters & scoped name post-actions
│   ├── audit.ts
│   ├── dedupe.ts
│   ├── list.ts
│   ├── why.ts
│   ├── pkg.ts
│   ├── link.ts
│   ├── root.ts
│   ├── run.ts
│   ├── exec.ts
│   ├── cache.ts
│   ├── patch.ts
│   ├── approve-builds.ts
│   └── default.ts
├── utils/
│   └── tarball.ts  # Registry metadata resolver & tarball downloader
├── config/
│   └── versions.ts # Target compatibility versions for npm and pnpm
└── cli/
    ├── npm.ts      # Drop-in replacement entrypoint for npm
    ├── npx.ts      # Drop-in replacement entrypoint for npx
    └── mpnp.ts     # Diagnostic and inspection CLI (--explain, --version)
```

---

## 🚀 Usage & Diagnostics

### Drop-in Shims

When installed globally (`pnpm add -g mpnp`), `mpnp` provides transparent binary shims via `package.json` `bin`:

- `npm` – drop-in replacement forwarding all commands and flags to `pnpm`
- `npx` – drop-in replacement forwarding to `pnpm dlx` or `pnpm exec`

### Dry-run Command Inspection (`MPNP_DRY_RUN`)

Inspect how any npm command will be converted without executing it by setting `MPNP_DRY_RUN=1`:

```bash
MPNP_DRY_RUN=1 npm install lodash -D
# Output: [mpnp dry-run] pnpm add lodash -D

MPNP_DRY_RUN=1 npm ci --omit=dev
# Output: [mpnp dry-run] pnpm install --prod --frozen-lockfile
```

---

## 🛠️ Development & Quality Scripts

Fast builds with Rolldown (`tsdown`) and instant linting/formatting via OXC (`oxlint`, `oxfmt`):

```bash
pnpm build         # Bundle all entrypoints in ~50ms to dist/
pnpm test          # Run 62 unit tests in Vitest in ~80ms
pnpm typecheck     # Verify types via tsc --noEmit
pnpm lint          # Lint codebase with oxlint & oxlint-config-universe in ~40ms
pnpm format        # Format codebase with oxfmt in ~5ms
pnpm format:check  # Check formatting with oxfmt --check
pnpm dep:check     # Analyze unused dependencies with knip
```
