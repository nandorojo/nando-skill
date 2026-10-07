# Verification record — 2026-09-13

Executed by the independent verification agent. This change modifies an architecture skill and its tooling; no application code was changed and no browser/product runtime verification is claimed.

## Commands and outcomes

Working directory: `skills/fernando-product-engineering/scripts/lint` unless noted.

- `npm install --ignore-scripts --registry=https://registry.npmjs.org --cache=/tmp/nando-npm-cache`: installed dependencies; audit found zero vulnerabilities. A lockfile records the resolved graph. Initial verification exposed deprecated ESLint 9; upgraded and pinned ESLint 10.10.0, then reran the full suite. The user's `min-release-age` npm setting remains an unrelated npm warning.
- `npm test`: **37 tests passed, zero failures**. Executes the actual type-aware ESLint profile against temporary TypeScript projects and the actual Query gate CLI in child processes. The CLI positive fixture invokes the installed TypeScript compiler plus executable behavior, vanilla recovery, and operation-evolution assertions.
- `node --check index.js` and `node --check query-gate.js`: passed.
- `npm ls --depth=0`: ESLint 10.10.0, TypeScript 5.9.3, typescript-eslint 8.70.0, TanStack Query lint plugin 5.102.8.
- `<validation-python> <skill-creator>/scripts/quick_validate.py skills/fernando-product-engineering` from the repository root: **Skill is valid!** The system Python initially lacked PyYAML; installed PyYAML 6.0.3 in an isolated temporary venv to run the supplied validator.
- Python traversal of skill Markdown links and generated heading anchors: all local file/heading links resolved. Read the effect/state guidance for contradictions; the positive exhaustive fixture follows the documented after-switch `assertNever` pattern.

- `npm ci --prefix <temporary package> --ignore-scripts --registry=https://registry.npmjs.org --cache=/tmp/nando-npm-cache`: clean installation from the final lockfile passed (98 packages; zero audit vulnerabilities). Offline attempts lacked cached registry metadata; network-enabled installation passed.
- `npm install --prefix <isolated consumer> --ignore-scripts --offline --registry=https://registry.npmjs.org --cache=/tmp/nando-npm-cache <temporary package>`: local package adoption passed. A Node script imported `createArchitectureConfig` from the public package name successfully.
- `<isolated consumer>/node_modules/.bin/nando-query-gate` without config: exited **1** with the expected usage diagnostic. This packaging check exposed an initial symlink entrypoint bug that silently exited zero; it was fixed and a permanent bin-symlink regression was added.
- `git diff --check` from the repository root: passed.

## Regression coverage

Tests reject direct, renamed, namespace, computed, destructured and resolvable re-exported React effects in features; browser transport and registered protocol imports; product/protocol imports and markers in generic DS files, including a workspace facade; nested ternaries; nonexhaustive workflow dispatch and missed union variants despite a catchall.

Configuration tests reject misspelled source roles, malformed optional inventories, and empty protocol markers.

Positive tests cover explicitly registered SDK React/host adapters within a feature glob, a locally shadowed `fetch`, unrelated same-name functions, neutral DS components, semantic ternaries, and complete switches followed by a typed never assertion. Query-gate failures cover absent public exports, absent symbols, missing acceptance fixtures, private-entry bypass, and failing behavior commands.

The Query gate fixture is explicitly a **synthetic SDK**, sufficient to validate the runner's import/export checks, compilation, command execution and failure propagation. It is not a production Query integration, real reconnect controller, or proof of any app's policy assertions.

## Limits

No production build, React Compiler transform, app browser run, cloud integration, or NTA runner applies to this isolated lint/skill package. No such runner is configured in its package manifest. Provider isolation, actual Query use behind owned facades, and meaningful SDK recovery/evolution behavior still require an adopting repository's reviewed fixtures and runtime checks. Static fixtures prove the focused lint rules, not arbitrary business-logic ownership or guaranteed one-shot app quality.

## Documentation follow-up — explicit build sequence

Reviewed the seven-stage working sequence, new `references/build-sequence.md`, and recipe cross-link. The sequence consistently separates core declarations from handler binding, places reusable lifecycle policy in the vanilla SDK, derives Query consumption, scopes host injection, and makes real end-to-end integration a completion requirement. Its greenfield, existing-feature, and narrow-change guidance preserves existing owners without requiring redundant layers. No ownership contradiction was found.

Reran the supplied `quick_validate.py` through the existing temporary Python venv: **Skill is valid!** A scan of all skill-local Markdown file/heading links passed, including the new build-sequence reference. `git diff --check` passed. This follow-up changed documentation only; the code suite was not rerun and no additional runtime/browser behavior is claimed.
