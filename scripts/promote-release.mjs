import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRelease, assetNames } from './release.mjs';

export async function sha256(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}
export function compareAssets(actual,expected,{complete=true}={}){
  const byName=new Map(expected.map(a=>[a.name,a]));
  if(complete && actual.length!==expected.length)throw new Error('Release asset count mismatch');
  for(const a of actual){
    const wanted=byName.get(a.name);
    if(!wanted || a.state!=='uploaded' || a.size!==wanted.size || a.digest!==`sha256:${wanted.sha256}`)throw new Error(`Conflicting or unverified asset: ${a.name}`);
  }
  if(new Set(actual.map(a=>a.name)).size!==actual.length)throw new Error('Duplicate release asset');
}
export async function inspectAssets(r,directory){
  const files=[];
  for(const name of assetNames(r)){
    const path=resolve(directory,name);
    const file=await stat(path);
    if(!file.isFile())throw new Error(`Not a regular release asset: ${name}`);
    files.push({name,path,size:file.size,sha256:await sha256(path)});
  }
  for(const d of r.downloads){const a=files.find(a=>a.name===d.filename);if(a.sha256!==d.sha256||a.size!==d.sizeBytes)throw new Error(`Signed binary identity mismatch: ${d.filename}`);}
  const record=JSON.parse(await readFile(resolve(directory,`Bristle-${r.version}-Verification.json`),'utf8'));
  if(record.sourceCommit!==r.sourceCommit||record.version!==r.version)throw new Error('Application provenance mismatch');
  for(const d of r.downloads){if(!record.artifacts.some(a=>a.filename===d.filename&&a.sha256===d.sha256&&a.sizeBytes===d.sizeBytes))throw new Error('Verification record does not identify both binaries');}
  const checksumName=`Bristle-${r.version}-SHA256SUMS.txt`;
  const manifest=(await readFile(resolve(directory,checksumName),'utf8')).trim().split(/\r?\n/).map(line=>{
    const match=/^([0-9a-f]{64})  ([A-Za-z0-9.-]+)$/.exec(line);if(!match)throw new Error('Invalid checksum manifest');return {sha256:match[1],name:match[2]};
  });
  const others=files.filter(a=>a.name!==checksumName);
  if(manifest.length!==others.length||new Set(manifest.map(a=>a.name)).size!==others.length)throw new Error('Checksum manifest must list each non-manifest asset exactly once');
  for(const a of others)if(!manifest.some(m=>m.name===a.name&&m.sha256===a.sha256))throw new Error(`Checksum mismatch: ${a.name}`);
  return files;
}
function gh(args,{allowFailure=false}={}){
  const result=spawnSync(process.env.GH_BIN||'gh',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GH_PROMPT_DISABLED:'1'}});
  if(result.error)throw result.error;
  if(result.status!==0&&!allowFailure)throw new Error(result.stderr.trim()||'GitHub CLI failed');
  return result;
}
const api=path=>{try{return JSON.parse(gh(['api',path]).stdout);}catch(error){throw new Error(`${path}: ${error.message}`);}};
function findRelease(r){
  for(let page=1;;page++){
    const releases=api(`repos/${r.repository}/releases?per_page=100&page=${page}`);
    const found=releases.find(item=>item.tag_name===r.tag);
    if(found)return found;
    if(releases.length<100)return null;
  }
}
async function main(){
  const args=process.argv.slice(2);
  const modes=args.filter(a=>['--check','--draft','--publish'].includes(a));
  if(modes.length!==1 || args.some(a=>a.startsWith('--')&&!['--check','--draft','--publish','--assets'].includes(a)))throw new Error('Use --check, --draft, or --publish, with --assets DIRECTORY');
  const r=await loadRelease();
  const at=args.indexOf('--assets');
  if(at>=0&&(!args[at+1]||args[at+1].startsWith('--')))throw new Error('--assets needs a directory');
  const directory=resolve(at>=0?args[at+1]:`.release/${r.tag}`);
  const expected=await inspectAssets(r,directory);
  if(modes[0]==='--check'){console.log(`Verified ${expected.length} local assets, signed binary hashes, source provenance, and complete checksum manifest.`);return;}
  const repo=api(`repos/${r.repository}`);
  if(repo.private||repo.full_name!==r.repository)throw new Error('Expected the dedicated public distribution repository');
  const source=api(`repos/${r.sourceRepository}/releases/tags/${r.tag}`);
  if(source.draft||!source.prerelease)throw new Error('Source must be a published beta release');
  for(const d of r.downloads){const a=source.assets.find(a=>a.name===d.filename);if(!a||a.digest!==`sha256:${d.sha256}`||a.size!==d.sizeBytes)throw new Error('Binary differs from the verified private release');}
  let release=findRelease(r);
  if(release){if(!release.prerelease)throw new Error('Existing tag is not a beta release');compareAssets(release.assets,expected,{complete:!release.draft});}
  else {
    if(modes[0]!=='--draft')throw new Error('Create and verify the draft first');
    const local=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true});
    if(local.status!==0)throw new Error('Public repository must have a committed publication snapshot');
    const sha=local.stdout.trim();
    const remote=api(`repos/${r.repository}/commits/${sha}`);if(remote.sha!==sha)throw new Error('Push the publication snapshot first');
    gh(['release','create',r.tag,'--repo',r.repository,'--target',sha,'--title',`Bristle ${r.label}`,'--notes-file',resolve('RELEASE_NOTES.md'),'--draft','--prerelease','--latest=false']);
    release=findRelease(r);
    if(!release)throw new Error('Draft creation returned without a discoverable release; inspect GitHub before retrying');
  }
  if(release.draft&&modes[0]==='--draft'){
    const missing=expected.filter(a=>!release.assets.some(b=>b.name===a.name));
    for(const a of missing){console.log(`Uploading ${a.name}`);gh(['release','upload',r.tag,a.path,'--repo',r.repository]);}
  }
  release=api(`repos/${r.repository}/releases/${release.id}`);
  compareAssets(release.assets,expected);
  if(release.draft&&modes[0]==='--publish'){
    gh(['release','edit',r.tag,'--repo',r.repository,'--draft=false','--prerelease','--latest=false']);
    release=api(`repos/${r.repository}/releases/${release.id}`);compareAssets(release.assets,expected);
  }
  console.log(JSON.stringify({url:release.html_url,tag:release.tag_name,draft:release.draft,assets:release.assets.map(a=>({name:a.name,digest:a.digest,size:a.size})),applicationSourceCommit:r.sourceCommit,publicationCommit:release.target_commitish},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
