#!/usr/bin/env node
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function assert(condition, message) { if (!condition) throw new Error(message); }
function targets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(targets);
}
function publicImports(source) {
  const found = new Set();
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) found.add(node.moduleSpecifier.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}

export function runQueryGate(configPath) {
  const base = path.dirname(path.resolve(configPath));
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  assert(typeof config.sdkPackageJson === 'string' && typeof config.reactEntry === 'string', 'sdkPackageJson and reactEntry are required.');
  const manifestPath = path.resolve(base, config.sdkPackageJson);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert(typeof manifest.name === 'string', 'SDK package must have a public package name.');
  const entry = path.resolve(base, config.reactEntry);
  assert(existsSync(entry), 'Configured React entry does not exist; build the SDK first if needed.');
  const publicTargets = targets(manifest.exports?.['./react']);
  assert(publicTargets.length > 0, 'SDK must export the public ./react subpath.');
  assert(publicTargets.some(target => target.startsWith('./') && existsSync(path.resolve(path.dirname(manifestPath), target)) && realpathSync(path.resolve(path.dirname(manifestPath), target)) === realpathSync(entry)), 'reactEntry must be an existing target of the package public ./react export.');
  assert(Array.isArray(config.requiredSymbols) && config.requiredSymbols.length > 0 && config.requiredSymbols.every(name => typeof name === 'string' && name.length > 0), 'Configure nonempty requiredSymbols for the chosen derived Query integration API.');
  const program = ts.createProgram([entry], { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022, allowJs: true, skipLibCheck: true, noEmit: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const symbol = source && checker.getSymbolAtLocation(source);
  const exports = new Set(symbol ? checker.getExportsOfModule(symbol).map(value => value.name) : []);
  for (const name of config.requiredSymbols) assert(exports.has(name), `Public React entry is missing required export ${name}.`);
  const prepared = [];
  for (const role of ['compile', 'behavior', 'secondClient', 'evolution']) {
    const check = config.checks?.[role];
    assert(check && typeof check.fixture === 'string', `Missing ${role} consumer fixture.`);
    const fixture = path.resolve(base, check.fixture);
    assert(existsSync(fixture), `Missing ${role} fixture file: ${check.fixture}`);
    const content = readFileSync(fixture, 'utf8');
    assert(content.trim().length > 0, `${role} fixture is empty.`);
    const imports = publicImports(ts.createSourceFile(fixture, content, ts.ScriptTarget.Latest, true, fixture.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
    const expected = `${manifest.name}${role === 'secondClient' ? '' : '/react'}`;
    assert(imports.has(expected), `${role} fixture must import ${expected} through its public package name.`);
    assert(Array.isArray(check.command) && check.command.length > 0 && check.command.every(arg => typeof arg === 'string' && arg.length > 0), `${role} requires an executable command array.`);
    prepared.push({ role, command: check.command });
  }
  // A configured command is a reviewed acceptance contract. Syntax cannot prove
  // its assertions cover recovery, mutation policy, or API evolution.
  for (const { role, command } of prepared) {
    const result = spawnSync(command[0], command.slice(1), { cwd: base, stdio: 'inherit', shell: false, timeout: config.timeoutMs ?? 120000 });
    assert(!result.error && result.status === 0, `${role} acceptance command failed${result.error ? `: ${result.error.message}` : ` (exit ${result.status})`}.`);
    process.stdout.write(`PASS ${role} configured acceptance command\n`);
  }
  return { checks: prepared.map(check => check.role), publicEntry: `${manifest.name}/react` };
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    assert(process.argv[2], 'Usage: nando-query-gate path/to/query-gate.json');
    runQueryGate(path.resolve(process.argv[2]));
  } catch (error) {
    process.stderr.write(`Query integration gate failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
