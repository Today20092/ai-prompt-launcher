import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const revision = 'e00cdde6ff787f801361ff85ed085775c775d4c5';
const archiveHash = '96d152f1d51a63c9f68ecb56debb22e0c8f7035330bf1092534e95b3d7300098';
const go = process.env.TAILCAT_GO ? resolve(process.env.TAILCAT_GO) : 'go';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public', 'tailcat');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const version = execFileSync(go, ['version'], { encoding: 'utf8' }).trim();
if (!version.startsWith('go version go1.27.2 ')) throw new Error('Use Go 1.27.2 (or set TAILCAT_GO to its executable).');

const temp = await mkdtemp(join(tmpdir(), 'promptroom-tailcat-'));
try {
  const response = await fetch(`https://codeload.github.com/tailscale/tailcat/tar.gz/${revision}`);
  if (!response.ok) throw new Error(`Source download failed: ${response.status}`);
  const archive = Buffer.from(await response.arrayBuffer());
  if (hash(archive) !== archiveHash) throw new Error('Tailcat source checksum mismatch.');
  const archivePath = join(temp, 'source.tar.gz');
  await writeFile(archivePath, archive);
  execFileSync('tar', ['-xzf', archivePath, '-C', temp]);
  const source = join(temp, `tailcat-${revision}`);
  const dist = join(temp, 'dist');
  const env = { ...process.env, PATH: `${dirname(resolve(go))}:${process.env.PATH}`, GOTOOLCHAIN: 'local', GOFLAGS: '-trimpath' };
  // The upstream builder invokes "go" itself, so preserve the selected toolchain on PATH.
  if (go === 'go') env.PATH = process.env.PATH;
  const run = (args, extraEnv = {}) => execFileSync(go, args, { cwd: source, env: { ...env, ...extraEnv }, encoding: 'utf8' });
  run(['run', './cmd/tailcat-webdist', '-o', dist]);
  const wasm = gunzipSync(await readFile(join(dist, 'main.wasm.gz')));
  if (!WebAssembly.validate(wasm)) throw new Error('Built asset is not valid WebAssembly.');

  const tagTool = join(source, 'cmd', 'promptroom-build-tags');
  await mkdir(tagTool);
  await writeFile(join(tagTool, 'main.go'), 'package main\nimport ("fmt"; "github.com/tailscale/tailcat/internal/buildtags")\nfunc main() { fmt.Print(buildtags.WasmTags()) }\n');
  const tags = run(['run', './cmd/promptroom-build-tags']).trim();
  const modules = new Set(run(['list', '-deps', '-tags', tags, '-f', '{{if .Module}}{{.Module.Path}}|{{.Module.Dir}}{{end}}', './web'], { GOOS: 'js', GOARCH: 'wasm' }).split('\n').filter(Boolean));
  const notices = ['Tailcat browser assets\n', `Source: https://github.com/tailscale/tailcat/tree/${revision}\n`];
  for (const module of modules) {
    const [moduleName, directory] = module.split('|');
    for (const name of (await readdir(directory)).sort()) {
      if (!/^(LICENSE|LICENCE|COPYING|NOTICE)(\.|$)/i.test(name)) continue;
      try { notices.push(`\n--- ${moduleName}: ${name} ---\n`, await readFile(join(directory, name), 'utf8')); } catch (error) {
        if (error.code !== 'EISDIR') throw error;
      }
    }
  }
  const goRoot = run(['env', 'GOROOT']).trim();
  notices.push('\n--- Go runtime LICENSE ---\n', await readFile(join(goRoot, 'LICENSE'), 'utf8'));
  await mkdir(output, { recursive: true });
  const assets = {};
  for (const name of ['main.wasm.gz', 'wasm_exec.js']) {
    await copyFile(join(dist, name), join(output, name));
    const bytes = await readFile(join(output, name));
    assets[name] = { bytes: bytes.length, sha256: hash(bytes) };
  }
  await writeFile(join(output, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n'));
  await writeFile(join(output, 'provenance.json'), `${JSON.stringify({ revision, sourceArchiveSha256: archiveHash, go: 'go1.27.2', flags: '-trimpath; upstream WASM feature tags; -ldflags=-s -w', assets }, null, 2)}\n`);
  console.log(`Built and validated tailcat assets in ${output}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
