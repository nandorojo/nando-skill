#!/bin/sh
set -eu

fixture_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/node_modules (requires zod, typescript, @types/node)" >&2
  exit 1
fi
dependencies_dir=$(CDPATH= cd -- "$1" && pwd)
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/contract-slice.XXXXXX")
trap 'rm -rf "$build_dir"' EXIT HUP INT TERM

FIXTURE_DIR="$fixture_dir" DEPENDENCIES_DIR="$dependencies_dir" BUILD_DIR="$build_dir" node <<'NODE'
const fs = require('node:fs')
const { FIXTURE_DIR, DEPENDENCIES_DIR, BUILD_DIR } = process.env
fs.writeFileSync(`${BUILD_DIR}/package.json`, JSON.stringify({ type: 'commonjs' }))
fs.writeFileSync(`${BUILD_DIR}/tsconfig.json`, JSON.stringify({
  compilerOptions: {
    target: 'ES2022', module: 'CommonJS', moduleResolution: 'Node',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'], strict: true,
    noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true,
    skipLibCheck: true, noEmitOnError: true,
    rootDir: FIXTURE_DIR, outDir: `${BUILD_DIR}/out`,
    paths: { zod: [`${DEPENDENCIES_DIR}/zod`] },
    typeRoots: [`${DEPENDENCIES_DIR}/@types`], types: ['node'],
  },
  include: [`${FIXTURE_DIR}/**/*.ts`],
}, null, 2))
NODE

node "$dependencies_dir/typescript/bin/tsc" -p "$build_dir/tsconfig.json"
NODE_PATH="$dependencies_dir" node --test "$build_dir/out/contracts.test.js"
