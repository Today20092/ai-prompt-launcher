import { copyFile, cp, mkdir } from 'node:fs/promises';

// Keep the original launcher's relative assets and browser storage intact.
const repository = new URL('../../', import.meta.url);
const legacy = new URL('../dist/legacy/', import.meta.url);
await mkdir(legacy, { recursive: true });
for (const name of ['index.html', 'style.css']) {
  await copyFile(new URL(name, repository), new URL(name, legacy));
}
await cp(new URL('js/', repository), new URL('js/', legacy), { recursive: true });
console.log('Original launcher staged at legacy/.');
