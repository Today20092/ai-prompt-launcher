import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{stdio:'inherit',env:{...process.env,PUBLIC_CLOUD:'true',DEPLOY_BASE:'/'}});
process.exit(result.status ?? 1);
