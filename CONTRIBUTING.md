# Contributing to mpnp

Thank you for your interest in contributing to **mpnp**! We welcome contributions that expand command coverage, improve translation fidelity, and optimize performance.

---

## Development Setup

### Prerequisites

- **Node.js**
- **pnpm**

### Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/fatidian1/mpnp.git
   cd mpnp
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

---

## Development Workflow & Scripts

- `pnpm test` — Run unit and integration tests via Vitest.
- `pnpm build` — Build TypeScript bundle using tsdown.
- `pnpm typecheck` — Verify TypeScript types without emitting files.
- `pnpm lint` — Run Oxlint linter.
- `pnpm format` / `pnpm format:check` — Format or check code formatting with Oxfmt.
- `pnpm dep:check` — Check for unused dependencies with Knip.

---

## Branching & Commit Conventions

- Create a feature or bugfix branch off `main`:
  ```bash
  git checkout -b feat/support-new-command
  ```
- Use **Conventional Commits** format for all commit messages:
  - `feat: add translation for npm query`
  - `fix: correct workspace filter mapping for -w flag`
  - `docs: update command translation matrix`
  - `test: add edge-case coverage for npm audit --fix`
  - `refactor: extract common flag converter`

---

## Core Engineering Guidelines

- **Fail-Fast (Zero Fallbacks)**: Do not create synthetic fallbacks or silent swallows. If a flag or command is unsupported or requires explicit user handling, throw a clear error or pass it cleanly according to specification.
- **Single Source of Truth**: Versions, ranges, and shared constants are defined in centralized configuration modules (`src/config/versions.ts`, `package.json`).
- **Dry-Run Inspection**: You can test command translations without executing them using the `MPNP_DRY_RUN=1` environment variable.

---

## Submitting a Pull Request

1. Ensure all quality checks pass before pushing:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm dep:check
   ```
2. Open a Pull Request targeting `main`.
3. Complete all sections of the Pull Request template.
