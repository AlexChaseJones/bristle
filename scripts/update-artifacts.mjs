import { createHash } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const architectures = ['arm64', 'x64']
const manifests = ['latest-mac.yml', 'beta-mac.yml']
const filename = (version, arch, ext) => `Bristle-${version}-mac-${arch}.${ext}`
const fileNames = (version, arches) => arches.flatMap(arch => ['zip', 'dmg'].map(ext => filename(version, arch, ext)))

async function fileIdentity(path) {
  const stat = await fs.lstat(path)
  if (!stat.isFile() || stat.size <= 0) throw new Error('Update assets must be nonempty regular files.')
  const sha256 = createHash('sha256'), sha512 = createHash('sha512')
  for await (const chunk of createReadStream(path)) { sha256.update(chunk); sha512.update(chunk) }
  return { sizeBytes: stat.size, sha256: sha256.digest('hex'), sha512: sha512.digest('base64') }
}

function validateManifest(info, version, arches) {
  const expected = fileNames(version, arches)
  if (!/^\d+\.\d+\.\d+$/.test(version) || info?.version !== version || !Array.isArray(info.files) || info.files.length !== expected.length ||
      new Set(info.files.map(file => file.url)).size !== expected.length || info.files.some(file => !expected.includes(file.url) ||
        !Number.isSafeInteger(file.size) || file.size <= 0 || !/^[A-Za-z0-9+/]{86}==$/.test(file.sha512 ?? ''))) throw new Error('Inconsistent Mac update version, architectures, names, or hashes.')
  return info
}

async function readManifest(path, version, arches) {
  if ((await fs.stat(path)).size > 256_000) throw new Error('Update manifest is too large.')
  return validateManifest(parse(await fs.readFile(path, 'utf8')), version, arches)
}

async function blockmapNames(directory, version, arches) {
  const names = []
  for (const arch of arches) {
    const name = filename(version, arch, 'zip.blockmap')
    try { await fs.lstat(join(directory, name)); names.push(name) } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (names.length && names.length !== arches.length) throw new Error('Missing architecture blockmap.')
  return names
}

export async function inspectMacUpdateArtifacts(directory, version) {
  const info = await readManifest(join(directory, manifests[0]), version, architectures)
  const second = await fs.readFile(join(directory, manifests[1]), 'utf8')
  if (second !== await fs.readFile(join(directory, manifests[0]), 'utf8')) throw new Error('Beta and stable update manifests differ.')
  for (const file of info.files) {
    const actual = await fileIdentity(join(directory, file.url))
    if (actual.sha512 !== file.sha512 || actual.sizeBytes !== file.size) throw new Error('Update manifest does not match the artifact bytes.')
  }
  const zip = info.files.find(file => file.url === info.path)
  if (!zip?.url.endsWith('.zip') || zip.sha512 !== info.sha512) throw new Error('Invalid default update archive.')
  const names = [...architectures.map(arch => filename(version, arch, 'zip')), ...await blockmapNames(directory, version, architectures), ...manifests].sort()
  return Promise.all(names.map(async name => { const { sizeBytes, sha256 } = await fileIdentity(join(directory, name)); return { filename: name, sizeBytes, sha256 } }))
}
