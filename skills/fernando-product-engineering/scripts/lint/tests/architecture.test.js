import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { createArchitectureConfig } from '../index.js';

async function project(t, files) {
  const root = await mkdtemp(path.join(tmpdir(), 'nando-lint-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const all = {
    'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, jsx: 'preserve', baseUrl: '.', paths: { '@owned/react': ['./owned/react.ts'], '@vendor/protocol': ['./vendor/protocol.ts'], '@app/sdk': ['./sdk/index.ts'] } }, include: ['**/*.ts', '**/*.tsx'] }),
    'node_modules/react/package.json': JSON.stringify({ name: 'react', types: 'index.d.ts' }),
    'node_modules/react/index.d.ts': 'export declare function useEffect(fn: () => unknown, deps: unknown[]): void; export declare function useLayoutEffect(fn: () => unknown, deps: unknown[]): void;',
    'owned/react.ts': 'export { useEffect, useLayoutEffect } from "react";',
    'owned/again.ts': 'export { useEffect as synchronize } from "./react";',
    'vendor/protocol.ts': 'export function decode() { return 1; }',
    'sdk/index.ts': 'export const product = 1;',
    ...files,
  };
  for (const [name, source] of Object.entries(all)) { await mkdir(path.dirname(path.join(root, name)), {recursive:true}); await writeFile(path.join(root,name), source); }
  return root;
}
async function lint(t, source, filename='features/example.tsx', files={}) {
  const root = await project(t, { [filename]: source, ...files });
  const config = createArchitectureConfig({ rootDir: root, tsconfig: 'tsconfig.json', sourceRoles: { portableFeature: ['features/**/*.tsx'], designSystem: ['ui/**/*.tsx'], statePresenter: ['presenters/**/*.tsx'], sdkReact: ['features/sdk-react/**/*.tsx'], hostAdapter: ['features/host/**/*.tsx'] }, protocolModules: ['@vendor/protocol'], productModules: ['@app/sdk'], protocolMarkers: ['vendor-protocol:ready'], discriminants: ['status','phase'] });
  const eslint = new ESLint({ cwd:root, overrideConfigFile:true, overrideConfig:config });
  const result = await eslint.lintFiles([filename]);
  assert.equal(result[0].fatalErrorCount,0, JSON.stringify(result[0].messages));
  return result[0].messages;
}
function has(messages, suffix) { return messages.some(m => m.ruleId?.endsWith(suffix)); }
for (const [name, source] of Object.entries({
  direct: 'import {useEffect} from "react"; useEffect(() => {}, []);',
  alias: 'import {useEffect as synchronize} from "react"; synchronize(() => {}, []);',
  namespace: 'import * as React from "react"; React.useLayoutEffect(() => {}, []);',
  owned: 'import {useEffect} from "@owned/react"; useEffect(() => {}, []);',
  transitive: 'import {synchronize} from "../owned/again"; synchronize(() => {}, []);',
})) test(`feature effects rejected: ${name}`, async t => assert.ok(has(await lint(t,source),'no-feature-effects')));
test('SDK React and host adapters may synchronize', async t => {
  const source='import {useEffect} from "react"; useEffect(() => {}, []);';
  for (const file of ['features/sdk-react/connection.tsx','features/host/browser.tsx']) assert.equal(has(await lint(t,source,file),'no-feature-effects'),false);
});
test('unrelated same-name function is valid', async t => assert.equal(has(await lint(t,'function useEffect() {} useEffect();'),'no-feature-effects'),false));
for (const [name, source] of Object.entries({fetch:'fetch("/api");', socket:'new WebSocket("wss://example.test");', events:'new EventSource("/stream");', protocol:'import {decode} from "@vendor/protocol"; decode();'})) test(`feature transport rejected: ${name}`,async t=> assert.ok(has(await lint(t,source),'no-feature-transport')));
test('SDK transport owner is valid',async t=>assert.equal(has(await lint(t,'fetch("/api");','sdk/connection.tsx'),'no-feature-transport'),false));
test('shadowed fetch is valid',async t=>assert.equal(has(await lint(t,'export function fetch(value: string) { return value; } fetch("label");'),'no-feature-transport'),false));
for (const source of ['import {decode} from "@vendor/protocol"; decode();','import {product} from "@app/sdk"; product;','const message = "vendor-protocol:ready";']) test(`DS purity rejects ${source}`,async t=>assert.ok(has(await lint(t,source,'ui/surface.tsx'),'design-system-purity')));
test('neutral DS surface is valid',async t=>assert.equal(has(await lint(t,'export function Surface(props: { onReady(): void }) { props.onReady(); }','ui/surface.tsx'),'design-system-purity'),false));
test('nested ternary rejected, semantic ternary allowed',async t=> {
  assert.ok(has(await lint(t,'declare const a:boolean,b:boolean; const x = a ? 1 : b ? 2 : 3;'),'no-nested-ternary'));
  assert.equal((await lint(t,'declare const disabled: boolean; const label = disabled ? "Unavailable" : "Continue";')).length,0);
});
const states='type State = {status:"pending"} | {status:"ready"} | {status:"failed"}; declare const state: State;';
test('workflow ternary rejected',async t=>assert.ok(has(await lint(t,states+' const view = state.status === "ready" ? "Ready" : "Other";','presenters/status.tsx'),'resource-state-dispatch')));
test('workflow if rejected',async t=>assert.ok(has(await lint(t,states+' if (state.status === "ready") { console.log("Ready"); }','presenters/status.tsx'),'resource-state-dispatch')));
test('exhaustive state switch accepted',async t=>assert.equal((await lint(t,states+' switch(state.status) { case "pending": break; case "ready": break; case "failed": break; }','presenters/status.tsx')).length,0));
test('new state fails exhaustiveness despite catchall',async t=>assert.ok(has(await lint(t,states+' switch(state.status) { case "pending": break; case "ready": break; default: break; }','presenters/status.tsx'),'switch-exhaustiveness-check')));

test('exhaustive switch supports a typed never assertion', async t => assert.equal((await lint(t, states + ' function assertNever(value: never): never { throw new Error(String(value)); } function render(state: State) { switch(state.status) { case "pending": return 1; case "ready": return 2; case "failed": return 3; } return assertNever(state); }', 'presenters/status.tsx')).length, 0));
test('aliased workflow discriminant must dispatch exhaustively', async t => assert.ok(has(await lint(t,states+' const {status: phase} = state; const view = phase === "ready" ? "Ready" : "Other";', 'presenters/status.tsx'),'resource-state-dispatch')));
test('computed React effect access rejected', async t => assert.ok(has(await lint(t,'import * as React from "react"; React["useEffect"](() => {}, []);'),'no-feature-effects')));
test('destructured namespace effect rejected', async t => assert.ok(has(await lint(t,'import * as React from "react"; const {useEffect: sync} = React; sync(() => {}, []);'),'no-feature-effects')));
test('DS rejects product import through workspace facade',async t=>assert.ok(has(await lint(t,'import {product} from "../owned/product"; product;','ui/surface.tsx',{'owned/product.ts':'export {product} from "@app/sdk";'}),'design-system-purity')));
test('profile rejects misspelled source roles', () => assert.throws(() => createArchitectureConfig({rootDir:process.cwd(),tsconfig:'tsconfig.json',sourceRoles:{portableFeature:['features/**'],designSytem:['ui/**']}}), /role/i));
test('profile rejects malformed optional inventory', () => assert.throws(() => createArchitectureConfig({rootDir:process.cwd(),tsconfig:'tsconfig.json',sourceRoles:{portableFeature:['features/**']},protocolModules:'@vendor/protocol'}), /protocolModules/));
test('profile rejects empty protocol marker', () => assert.throws(() => createArchitectureConfig({rootDir:process.cwd(),tsconfig:'tsconfig.json',sourceRoles:{portableFeature:['features/**']},protocolMarkers:['']}), /protocolMarkers/));
