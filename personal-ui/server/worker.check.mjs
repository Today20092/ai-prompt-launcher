import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare } = wranglerRequire('miniflare');

test('guest cannot save and cross-origin mutations are denied', async () => {
  const env = { AUTH_BASE_URL: 'https://example.test' };
  const request = origin => new Request('https://example.test/api/prompts', {method:'POST',headers:{Origin:origin}});
  assert.equal((await worker.fetch(request('https://other.test'),env)).status,403);
  assert.equal((await worker.fetch(request(env.AUTH_BASE_URL),env)).status,401);
});

test('local Worker and D1 enforce ownership, revision conflicts, and publication review', async () => {
  const origin = 'http://localhost', secret = 'synthetic-test-secret-at-least-32-characters';
  const env = Object.fromEntries(Object.entries({AUTH_BASE_URL:origin,AUTH_SECRET:secret,GOOGLE_CLIENT_ID:'synthetic',GOOGLE_CLIENT_SECRET:'synthetic'}).map(([key,value])=>[key,{type:'text',value}]));
  const runtime = new Miniflare({workers:[{config:{name:'test',compatibilityDate:'2026-10-04',compatibilityFlags:['nodejs_compat'],manifest:{mainModule:'worker.js',modules:{'worker.js':{type:'esm',contents:readFileSync(new URL('../.wrangler/dry-run/worker.js',import.meta.url),'utf8')}}},env:{...env,DB:{type:'d1',id:'test'}}}}]});
  try {
    const db = await runtime.getD1Database('DB');
    const migration = readFileSync(new URL('../migrations/0001_auth_and_prompts.sql',import.meta.url),'utf8');
    for (const sql of migration.split(';').filter(sql=>sql.trim())) await db.prepare(sql).run();
    for (const id of ['alice','bob','moderator']) {
      await db.prepare('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,?,?)').bind(id,id,`${id}@example.test`,Date.now(),Date.now()).run();
      await db.prepare('INSERT INTO session(id,token,userId,expiresAt,createdAt,updatedAt) VALUES(?,?,?,?,?,?)').bind(id,id,id,Date.now()+86400000,Date.now(),Date.now()).run();
    }
    await db.prepare("INSERT INTO moderators(owner) VALUES('moderator')").run();
    const call = async (path, user, method = 'GET', input) => {
      const headers = {Origin:origin};
      if (user) headers.Cookie = `better-auth.session_token=${encodeURIComponent(`${user}.${createHmac('sha256',secret).update(user).digest('base64')}`)}`;
      if (input) headers['Content-Type'] = 'application/json';
      return runtime.dispatchFetch(`${origin}${path}`,{method,headers,body:input ? JSON.stringify(input) : undefined});
    };
    assert.deepEqual(await (await call('/api/config')).json(),{googleEnabled:true});
    const data = {title:'Exact <title>',description:'Description',body:'Keep {{input}}\n<text> & spaces  ',status:'private'};
    const saved = await call('/api/prompts','alice','POST',{...data,values:{input:'NEVER STORE THIS'}});
    assert.equal(saved.status,201);
    const row = await saved.json();
    assert.equal(row.body,data.body);
    assert.equal(row.revision,1);
    assert.equal(JSON.stringify(row).includes('NEVER STORE THIS'),false);
    assert.deepEqual(await (await call('/api/prompts','bob')).json(),[]);
    assert.equal((await call(`/api/prompts/${row.id}`,'bob','PUT',{...data,revision:1})).status,404);
    const update = await call(`/api/prompts/${row.id}`,'alice','PUT',{...data,title:'Updated',revision:1});
    assert.equal(update.status,200);
    assert.equal((await update.json()).revision,2);
    assert.equal((await call(`/api/prompts/${row.id}`,'alice','PUT',{...data,revision:1})).status,409);
    assert.equal((await call(`/api/prompts/${row.id}`,'alice','DELETE',{revision:1})).status,409);
    assert.equal((await (await call('/api/prompts','alice')).json())[0].title,'Updated');
    assert.equal((await call(`/api/prompts/${row.id}`,'alice','DELETE',{revision:2})).status,200);
    assert.equal((await call('/api/prompts','alice','POST',{...data,status:'pending'})).status,400);
    const pending = await (await call('/api/prompts','alice','POST',{...data,status:'pending',consent:true})).json();
    assert.deepEqual(await (await call('/api/library')).json(),[]);
    assert.equal((await call(`/p/${pending.id}`)).status,404);
    assert.equal((await call('/api/approve','alice','POST',{id:pending.id})).status,403);
    assert.equal((await call('/api/pending','moderator')).status,200);
    assert.equal((await call('/api/approve','moderator','POST',{id:pending.id})).status,200);
    assert.equal((await call(`/api/library/${pending.id}`)).status,200);
    const html = await (await call(`/p/${pending.id}`)).text();
    assert.ok(html.includes('Exact &lt;title&gt;'));
    assert.ok(html.includes('&lt;text&gt; &amp; spaces  '));
    assert.equal((await call(`/api/prompts/${pending.id}`,'alice','PUT',{...data,revision:1})).status,404);
    assert.equal((await call('/api/unpublish','moderator','POST',{id:pending.id})).status,200);
    assert.equal((await call(`/api/library/${pending.id}`)).status,404);
    const rejected = await (await call('/api/prompts','alice','POST',{...data,status:'pending',consent:true})).json();
    assert.equal((await call('/api/reject','moderator','POST',{id:rejected.id})).status,200);
    assert.deepEqual(await (await call('/api/pending','moderator')).json(),[]);
    assert.equal((await call('/api/prompts','alice','POST',{...data,status:'approved'})).status,400);
    assert.equal((await call('/api/prompts','alice','POST',{...data,body:'x'.repeat(140000)})).status,413);
    assert.equal((await runtime.dispatchFetch(`${origin}/api/prompts`,{method:'POST',headers:{Origin:'https://other.test'}})).status,403);
    assert.equal((await call('/api/auth/sign-up/email',null,'POST',{email:'x@example.test',password:'synthetic-password',name:'X'})).status,400);
  } finally { await runtime.dispose(); }
});
