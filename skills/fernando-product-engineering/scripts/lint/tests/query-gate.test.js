// A deliberately small synthetic SDK tests the gate harness. It is not a
// production React Query implementation or proof of an adopting app's policy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const cli=fileURLToPath(new URL('../query-gate.js',import.meta.url));
const tsc=fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url));
async function fixture(t, change=()=>{}) {
 const root=await mkdtemp(path.join(tmpdir(),'nando-query-gate-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const pkg={ name:'@fixture/sdk',type:'module',exports:{'.':'./index.js','./react':'./react.js'} };
 const config={sdkPackageJson:'node_modules/@fixture/sdk/package.json',reactEntry:'node_modules/@fixture/sdk/react.js',requiredSymbols:['deriveQueries','setMutationDefaults'],checks:{}};
 for(const role of ['compile','behavior','secondClient','evolution']) config.checks[role]={fixture:`${role}.mjs`,command:role==='compile'?[process.execPath,tsc,'--noEmit','--allowJs','--checkJs','--module','nodenext','--target','es2022','compile.mjs']:[process.execPath,`${role}.mjs`]};
 const files={
 'node_modules/@fixture/sdk/index.js':'export function createClient() { let connected=false; return {connect() { connected=true; }, disconnect(){connected=false;}, recover(){connected=true;}, get connected(){return connected;} }; }',
 'node_modules/@fixture/sdk/react.js':'export function deriveQueries(operations) { return Object.fromEntries(Object.entries(operations).map(([key,fn])=>[key,{getOptions:(input)=>({queryKey:[key,input],queryFn:()=>fn(input)})}])); } export function setMutationDefaults(client) { client.policy="central"; }',
 'compile.mjs':'import {deriveQueries,setMutationDefaults} from "@fixture/sdk/react"; const queries=deriveQueries({hello:()=>"ok"}); queries.hello.getOptions(undefined).queryFn(); setMutationDefaults({});',
 'behavior.mjs':'import {deriveQueries,setMutationDefaults} from "@fixture/sdk/react"; import assert from "node:assert/strict"; const client={}; setMutationDefaults(client); assert.equal(client.policy,"central"); const queries=deriveQueries({hello:()=>"ok"}); assert.equal(queries.hello.getOptions().queryFn(),"ok");',
 'secondClient.mjs':'import {createClient} from "@fixture/sdk"; import assert from "node:assert/strict"; const client=createClient(); client.connect(); client.disconnect(); assert.equal(client.connected,false); client.recover(); assert.equal(client.connected,true);',
 'evolution.mjs':'import {deriveQueries} from "@fixture/sdk/react"; import assert from "node:assert/strict"; const operations={first:()=>1,added:()=>2}; const queries=deriveQueries(operations); assert.equal(queries.added.getOptions().queryFn(),2);',
 };
 change({pkg,config,files});
 files['node_modules/@fixture/sdk/package.json']=JSON.stringify(pkg);
 files['query-gate.json']=JSON.stringify(config);
 for(const [name,source] of Object.entries(files)){await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),source);}
 return spawnSync(process.execPath,[cli,path.join(root,'query-gate.json')],{encoding:'utf8',timeout:30000});
}
test('CLI runs compiled public consumer and all behavioral commands',async t=>{const r=await fixture(t);assert.equal(r.status,0,r.stdout+r.stderr);for(const name of ['compile','behavior','secondClient','evolution'])assert.match(r.stdout,new RegExp(`PASS ${name}`));});
test('CLI rejects missing public Query export',async t=>{const r=await fixture(t,({pkg})=>delete pkg.exports['./react']);assert.notEqual(r.status,0);assert.match(r.stderr,/public .\/react/);});
test('CLI rejects missing required symbol',async t=>{const r=await fixture(t,({config})=>config.requiredSymbols.push('missing'));assert.notEqual(r.status,0);assert.match(r.stderr,/missing required export missing/);});
test('CLI rejects missing evolution acceptance',async t=>{const r=await fixture(t,({config})=>delete config.checks.evolution);assert.notEqual(r.status,0);assert.match(r.stderr,/Missing evolution/);});
test('CLI rejects consumers that bypass public SDK entry',async t=>{const r=await fixture(t,({files})=>files['secondClient.mjs']='export const ignored=1;');assert.notEqual(r.status,0);assert.match(r.stderr,/secondClient fixture must import/);});
test('CLI propagates a failed behavior command',async t=>{const r=await fixture(t,({files})=>files['behavior.mjs']+=' throw new Error("Intentional fixture failure");');assert.notEqual(r.status,0);assert.match(r.stderr,/behavior acceptance command failed/);});

test('installed bin symlink executes CLI and rejects missing config', async t => {
 const root=await mkdtemp(path.join(tmpdir(),'nando-bin-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const bin=path.join(root,'nando-query-gate'); await symlink(cli,bin);
 const result=spawnSync(process.execPath,[bin],{encoding:'utf8'});
 assert.equal(result.status,1); assert.match(result.stderr,/Usage: nando-query-gate/);
});
