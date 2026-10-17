import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PromptTemplate } from '@/lib/prompt';
import type { ShareSnapshot } from '@/lib/sharing';

type Row = { id: string; title: string; description: string; body: string; status?: string };
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function readAccountPrompts(value: unknown): Row[] {
  if (!Array.isArray(value)) throw new Error('The prompt list could not be read.');
  return value.map(row => {
    if (!record(row) || !['id','title','description','body'].every(key => typeof row[key] === 'string') ||
        (row.status !== undefined && !['private','pending','approved'].includes(String(row.status)))) throw new Error('The prompt list could not be read.');
    return { id: row.id as string, title: row.title as string, description: row.description as string, body: row.body as string, status: row.status as string | undefined };
  });
}
async function api(path: string, data?: unknown) {
  const response = await fetch(path, { method: data === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type':'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(15000) });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = record(result) && typeof result.message === 'string' ? result.message : record(result) && typeof result.error === 'string' ? result.error : 'The account service is unavailable. Try again.';
    throw new Error(message);
  }
  return result;
}

export default function AccountLibrary({ explore, template, onOpen, onSignOut }: {
  explore: boolean; template: PromptTemplate; onOpen: (snapshot: ShareSnapshot) => void; onSignOut: () => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [register, setRegister] = useState(false);
  const [status, setStatus] = useState('Loading…');
  const [busy, setBusy] = useState(true);
  const alive = useRef(true);
  useEffect(() => {
    let ignore = false;
    alive.current = true;
    async function load() {
      try {
        const session = await api('/api/auth/get-session');
        const accountEmail = record(session) && record(session.user) && typeof session.user.email === 'string' ? session.user.email : null;
        const items = explore ? await api('/api/library') : accountEmail ? await api('/api/prompts') : [];
        const parsed = readAccountPrompts(items);
        if (!ignore) { setEmail(accountEmail); setRows(parsed); setStatus(''); }
      } catch(error) { if (!ignore) setStatus(error instanceof Error ? error.message : 'Account service unavailable.'); }
      finally { if (!ignore) setBusy(false); }
    }
    void load();
    return () => { ignore = true; alive.current = false; };
  }, [explore]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setStatus('');
    try { await action(); }
    catch(error) { if (alive.current) setStatus(error instanceof Error ? error.message : 'The request failed.'); }
    finally { if (alive.current) setBusy(false); }
  }
  async function signIn(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, fields = new FormData(form);
    const data = {email:String(fields.get('email')),password:String(fields.get('password')),name:String(fields.get('name') ?? '')};
    await run(async () => {
      await api(register ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email',data);
      if (!alive.current) return;
      form.reset(); setEmail(data.email);
      const items = readAccountPrompts(await api('/api/prompts'));
      if (alive.current) { setRows(items); setStatus('Signed in. Existing browser prompts have not been uploaded.'); }
    });
  }
  async function save(status: 'private' | 'pending') {
    const data = {title:template.title,description:template.description,body:template.body,status};
    await run(async () => {
      await api('/api/prompts',data);
      const items = readAccountPrompts(await api('/api/prompts'));
      if (alive.current) { setRows(items); setStatus(status === 'private' ? 'Private template copy saved. Pasted input was excluded.' : 'Template submitted for review. It is not public yet. Pasted input was excluded.'); }
    });
  }
  return <div className="account-library">
    <p className="muted">{explore ? 'Find an approved prompt and open an independent, temporary copy in your workbench.' : 'Account copies are separate from prompts saved in this browser. Nothing uploads automatically.'}</p>
    <p className="account-development">Private development preview. Use a test account; email verification and password recovery are not available yet.</p>
    {!explore && !email && <form onSubmit={signIn}>
      <FieldGroup>
        {register && <Field><FieldLabel htmlFor="account-name">Name</FieldLabel><Input id="account-name" name="name" autoComplete="name" required /></Field>}
        <Field><FieldLabel htmlFor="account-email">Email</FieldLabel><Input id="account-email" name="email" type="email" autoComplete="username" required /></Field>
        <Field><FieldLabel htmlFor="account-password">Password</FieldLabel><Input id="account-password" name="password" type="password" minLength={8} autoComplete={register ? 'new-password' : 'current-password'} required /></Field>
      </FieldGroup>
      <div className="account-actions"><Button type="submit" disabled={busy}>{register ? 'Create test account' : 'Sign in'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setRegister(!register)}>{register ? 'Already have an account?' : 'Create test account'}</Button></div>
    </form>}
    {!explore && email && <>
      <div className="account-actions"><p>Signed in as {email}</p><Button variant="outline" disabled={busy} onClick={() => void run(async () => { await api('/api/auth/sign-out',{}); if (alive.current) { setEmail(null); setRows([]); setStatus('Signed out.'); onSignOut(); } })}>Sign out</Button></div>
      <section aria-label="Save current template"><h3>Current template: {template.title}</h3><p className="muted">Only the reusable template is sent. Pasted field values and device settings are excluded.</p><div className="account-actions"><Button disabled={busy} onClick={() => void save('private')}>Save private copy</Button><Button variant="outline" disabled={busy} onClick={() => void save('pending')}>Submit for community review</Button></div></section>
    </>}
    {(explore || email) && <>
      <Field><FieldLabel htmlFor="account-search">{explore ? 'Search community prompts' : 'Search account prompts'}</FieldLabel><Input id="account-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} /></Field>
      <div className="account-prompt-list">{rows.filter(row=>(row.title+' '+row.description).toLowerCase().includes(query.toLowerCase())).map(row=><article key={row.id}>
        <h3>{row.title}</h3><p className="muted">{row.description}</p>{row.status && <p className="muted">{row.status === 'pending' ? 'Awaiting review' : row.status === 'private' ? 'Private to your account' : 'Published'}</p>}
        <Button variant="outline" onClick={()=>onOpen({format:'promptroom-share',version:1,template:{title:row.title,description:row.description,body:row.body}})}>Open in workbench</Button>
      </article>)}</div>
      {!rows.length && !busy && <p>{explore ? 'No approved community prompts yet.' : 'No account copies yet. Save your current template to start.'}</p>}
    </>}
    <p role="status" aria-live="polite">{status}</p>
  </div>;
}
