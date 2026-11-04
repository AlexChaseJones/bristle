import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRelease, validateRelease } from '../scripts/release.mjs';
import { compareAssets, inspectAssets } from '../scripts/promote-release.mjs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const r=await loadRelease();
test('rejects wrong version, duplicate architecture and path traversal before publication',()=>{
  for(const change of [{tag:'v0.1.11.-beta.1'},{tag:'v0.1.12-beta.1'},{downloads:[r.downloads[0],r.downloads[0]]},{documents:[...r.documents.slice(1),{filename:'../../private.txt'}]},{repository:r.sourceRepository}])assert.throws(()=>validateRelease({...r,...change}));
});
test('existing assets may be reused only with identical size and digest',()=>{
  const expected=[{name:'a.dmg',size:123,sha256:'a'.repeat(64)}];
  const actual=[{name:'a.dmg',state:'uploaded',size:123,digest:'sha256:'+'a'.repeat(64)}];
  assert.doesNotThrow(()=>compareAssets(actual,expected));
  assert.throws(()=>compareAssets([{...actual[0],digest:'sha256:'+'b'.repeat(64)}],expected));
  assert.throws(()=>compareAssets([{...actual[0],size:124}],expected));
  assert.throws(()=>compareAssets([{...actual[0],name:'private.log'}],expected));
  assert.throws(()=>compareAssets([],expected));
  assert.doesNotThrow(()=>compareAssets([],expected,{complete:false}));
});
test('tampered local installer is rejected before network or upload',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'bristle-release-test-'));
  try{
    for(const a of [...r.downloads,...r.documents])await writeFile(join(directory,a.filename),'changed');
    await assert.rejects(inspectAssets(r,directory),/Signed binary identity mismatch/);
  }finally{
    if(!directory.startsWith(join(tmpdir(),'bristle-release-test-')))throw new Error('Unexpected test cleanup path');
    await rm(directory,{recursive:true,force:true});
  }
});
