import { readFile } from 'node:fs/promises';

export function validateRelease(r) {
  if (r.repository !== 'AlexChaseJones/bristle' || r.sourceRepository !== 'AlexChaseJones/request-grove') throw new Error('Unexpected release repository');
  if (!/^\d+\.\d+\.\d+$/.test(r.version) || !new RegExp(`^v${r.version.replaceAll('.', '\\.')}-beta\\.[1-9]\\d*$`).test(r.tag)) throw new Error('Expected a versioned beta tag');
  if (!/^[0-9a-f]{40}$/.test(r.sourceCommit)) throw new Error('Expected the full application source SHA');
  if (r.siteUrl !== 'https://bristlebristle.app') throw new Error('Unexpected canonical site URL');
  if (!Array.isArray(r.downloads) || r.downloads.length !== 2 || new Set(r.downloads.map(d => d.arch)).size !== 2) throw new Error('Both Mac architectures are required');
  for (const d of r.downloads) {
    if (!['arm64','x64'].includes(d.arch) || d.filename !== `Bristle-${r.version}-mac-${d.arch}.dmg` || !/^[0-9a-f]{64}$/.test(d.sha256) || !Number.isSafeInteger(d.sizeBytes) || d.sizeBytes <= 0) throw new Error('Invalid binary identity');
  }
  const expected = ['IT-Review.pdf','SHA256SUMS.txt','Verification.json','Signing-Evidence.zip'].map(s => `Bristle-${r.version}-${s}`);
  if (r.documents?.length !== expected.length || expected.some(name => !r.documents.some(d => d.filename === name))) throw new Error('Missing or unexpected review documents');
  return r;
}
export async function loadRelease() {
  return validateRelease(JSON.parse(await readFile(new URL('../site/release.json', import.meta.url), 'utf8')));
}
export const releaseUrl = r => `https://github.com/${r.repository}/releases/tag/${r.tag}`;
export const assetUrl = (r, filename) => `https://github.com/${r.repository}/releases/download/${r.tag}/${filename}`;
export const assetNames = r => [...r.downloads, ...r.documents].map(d => d.filename);
