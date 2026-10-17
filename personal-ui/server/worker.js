import { betterAuth } from 'better-auth';

const json = (data, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store'}});
const fail = (status, message) => { throw Object.assign(new Error(message), {status}); };
const fields = 'id,title,description,body,status,revision';
const enabled = env => Boolean(env.AUTH_SECRET && env.AUTH_BASE_URL && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function auth(env) {
  return betterAuth({database:env.DB,secret:env.AUTH_SECRET,baseURL:env.AUTH_BASE_URL,trustedOrigins:[env.AUTH_BASE_URL],
    emailAndPassword:{enabled:false},socialProviders:{google:{clientId:env.GOOGLE_CLIENT_ID,clientSecret:env.GOOGLE_CLIENT_SECRET}},
    advanced:{useSecureCookies:new URL(env.AUTH_BASE_URL).protocol === 'https:'}});
}
async function body(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415,'JSON required');
  const reader = request.body?.getReader();
  if (!reader) fail(400,'Body required');
  const chunks = []; let size = 0;
  for (;;) {
    const {done,value} = await reader.read(); if (done) break;
    size += value.length;
    if (size > 128 * 1024) { await reader.cancel(); fail(413,'128 KiB request limit'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  try {
    const input = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400,'JSON object required');
    return input;
  } catch { fail(400,'Invalid JSON'); }
}
function text(value, limit, required = true) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) fail(400,'Invalid text field');
  return value;
}
const template = input => ({title:text(input.title,160),description:text(input.description ?? '',500,false),body:text(input.body,64000)});
function revision(input) {
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) fail(400,'Revision required');
  return input.revision;
}
async function handle(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (!path.startsWith('/api/') && !path.startsWith('/p/')) return env.ASSETS.fetch(request);
  if (!['GET','HEAD'].includes(method) && request.headers.get('origin') !== env.AUTH_BASE_URL) fail(403,'Same-origin request required');
  if (path === '/api/config' && method === 'GET') return json({googleEnabled:enabled(env)});
  if (path.startsWith('/api/auth/')) {
    if (!enabled(env)) return path === '/api/auth/get-session' && method === 'GET' ? json(null) : json({error:'Sign-in is not configured'},503);
    if (method === 'POST') request = new Request(request,{body:JSON.stringify(await body(request))});
    const response = await auth(env).handler(request);
    const headers = new Headers(response.headers); headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,headers});
  }
  if (path === '/api/library' && method === 'GET') {
    const q = text(url.searchParams.get('q') ?? '',160,false);
    return json((await env.DB.prepare(`SELECT ${fields} FROM prompts WHERE status='approved' AND title LIKE ? ORDER BY created DESC,id LIMIT 100`).bind(`%${q}%`).all()).results);
  }
  if ((path.startsWith('/api/library/') || path.startsWith('/p/')) && method === 'GET') {
    const id = path.slice(path.startsWith('/p/') ? 3 : 13);
    const row = await env.DB.prepare(`SELECT ${fields} FROM prompts WHERE id=? AND status='approved'`).bind(id).first();
    if (!row) fail(404,'Prompt not found');
    if (!path.startsWith('/p/')) return json(row);
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(row.title)} · Promptroom</title><meta name="description" content="${escape(row.description)}"><meta property="og:title" content="${escape(row.title)}"><meta property="og:description" content="${escape(row.description)}"><meta name="robots" content="index,follow"></head><body><main><h1>${escape(row.title)}</h1><p>${escape(row.description)}</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(row.body)}</pre><p>Shared under CC0.</p><a href="/?community=${encodeURIComponent(row.id)}">Open in Promptroom</a></main></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  }
  const session = enabled(env) ? await auth(env).api.getSession({headers:request.headers}) : null;
  const owner = session?.user.id;
  if (!owner) fail(401,'Sign in required');
  if (path === '/api/prompts') {
    if (method === 'GET') return json((await env.DB.prepare(`SELECT ${fields} FROM prompts WHERE owner=? ORDER BY created DESC,id LIMIT 100`).bind(owner).all()).results);
    if (method === 'POST') {
      const input = await body(request), data = template(input);
      if (!['private','pending'].includes(input.status)) fail(400,'New prompts must be private or pending');
      if (input.status === 'pending' && input.consent !== true) fail(400,'CC0 publication consent required');
      const id = crypto.randomUUID();
      // Bound account storage and review spam on the free database.
      const inserted = await env.DB.prepare('INSERT INTO prompts(id,owner,title,description,body,status,created,revision) SELECT ?,?,?,?,?,?,?,1 WHERE (SELECT COUNT(*) FROM prompts WHERE owner=?) < 100').bind(id,owner,data.title,data.description,data.body,input.status,Date.now(),owner).run();
      if (!inserted.meta.changes) fail(429,'Account prompt limit reached (100)');
      return json({id,...data,status:input.status,revision:1},201);
    }
  }
  if (path.startsWith('/api/prompts/') && ['PUT','DELETE'].includes(method)) {
    const id = path.slice(13), input = await body(request), expected = revision(input);
    const data = method === 'PUT' ? template(input) : null;
    const statement = data ? env.DB.prepare("UPDATE prompts SET title=?,description=?,body=?,revision=revision+1 WHERE id=? AND owner=? AND status='private' AND revision=?").bind(data.title,data.description,data.body,id,owner,expected)
      : env.DB.prepare("DELETE FROM prompts WHERE id=? AND owner=? AND status='private' AND revision=?").bind(id,owner,expected);
    const result = await statement.run();
    if (!result.meta.changes) {
      const row = await env.DB.prepare("SELECT revision FROM prompts WHERE id=? AND owner=? AND status='private'").bind(id,owner).first();
      fail(row ? 409 : 404,row ? 'Prompt changed. Reload before saving.' : 'Private prompt not found');
    }
    return json(data ? {id,...data,status:'private',revision:expected+1} : {deleted:id});
  }
  const moderator = Boolean(await env.DB.prepare('SELECT owner FROM moderators WHERE owner=?').bind(owner).first());
  if (path === '/api/moderation' && method === 'GET') return json({moderator});
  if (['/api/pending','/api/approve','/api/reject','/api/unpublish'].includes(path)) {
    if (!moderator) fail(403,'Moderator required');
    if (path === '/api/pending' && method === 'GET') return json((await env.DB.prepare(`SELECT ${fields} FROM prompts WHERE status='pending' ORDER BY created,id LIMIT 100`).all()).results);
    if (method === 'POST' && path !== '/api/pending') {
      const id = text((await body(request)).id,100);
      const sql = path === '/api/approve' ? "UPDATE prompts SET status='approved' WHERE id=? AND status='pending'" : path === '/api/reject' ? "DELETE FROM prompts WHERE id=? AND status='pending'" : "DELETE FROM prompts WHERE id=? AND status='approved'";
      if (!(await env.DB.prepare(sql).bind(id).run()).meta.changes) fail(404,'Submission not found');
      return json({id});
    }
  }
  fail(404,'No route');
}
export default {async fetch(request,env) {
  try { return await handle(request,env); }
  catch (error) { return json({error:error.status ? error.message : 'Request failed'},error.status ?? 500); }
}};
