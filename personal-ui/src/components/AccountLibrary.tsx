import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PromptTemplate } from '@/lib/prompt';
import { readSnapshot, SHARE_FILE_LIMIT, type ShareSnapshot } from '@/lib/sharing';

export type AccountAssociation = { owner: string; id: string; revision: number };
type Row = {
  id: string;
  title: string;
  description: string;
  body: string;
  status?: string;
  revision?: number;
};
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
export function readAccountPrompts(value: unknown): Row[] {
  if (!Array.isArray(value)) throw new Error('The prompt list could not be read.');
  return value.map((row) => {
    if (
      !record(row) ||
      !['id', 'title', 'description', 'body'].every((key) => typeof row[key] === 'string') ||
      (row.status !== undefined &&
        !['private', 'pending', 'approved'].includes(String(row.status))) ||
      (row.revision !== undefined &&
        (!Number.isSafeInteger(row.revision) || Number(row.revision) < 1))
    )
      throw new Error('The prompt list could not be read.');
    return row as Row;
  });
}
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function requestApi(
  path: string,
  data?: unknown,
  method = data === undefined ? 'GET' : 'POST',
  expectedOwner?: string | null,
) {
  const authenticated =
    (!path.startsWith('/api/auth/') &&
      !path.startsWith('/api/library') &&
      path !== '/api/config') ||
    path === '/api/auth/sign-out';
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && expectedOwner ? { 'X-Promptroom-Owner': expectedOwner } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  });
  const result: unknown = await response.json();
  if (!response.ok)
    throw new ApiError(
      record(result) && typeof result.message === 'string'
        ? result.message
        : record(result) && typeof result.error === 'string'
          ? result.error
          : 'The account service is unavailable. Try again.',
      response.status,
    );
  return result;
}
const snapshot = (row: Pick<Row, 'title' | 'description' | 'body'>): ShareSnapshot => ({
  format: 'promptroom-share',
  version: 1,
  template: { title: row.title, description: row.description, body: row.body },
});

export default function AccountLibrary({
  explore,
  template,
  association,
  onAssociation,
  onOpen,
  onSignOut,
}: {
  explore: boolean;
  template: PromptTemplate;
  association?: AccountAssociation | null;
  onAssociation?: (value: AccountAssociation | null) => void;
  onOpen: (value: ShareSnapshot, association?: AccountAssociation) => void;
  onSignOut: () => void;
}) {
  const [email, setEmail] = useState<string | null>(null),
    [google, setGoogle] = useState(false),
    [rows, setRows] = useState<Row[]>([]),
    [pending, setPending] = useState<Row[]>([]);
  const [moderator, setModerator] = useState(false),
    [query, setQuery] = useState(''),
    [status, setStatus] = useState('Loading…'),
    [busy, setBusy] = useState(true),
    [conflict, setConflict] = useState(false);
  const [submission, setSubmission] = useState<ShareSnapshot | null>(null),
    [consent, setConsent] = useState(false);
  const epoch = useRef(0),
    alive = useRef(false),
    owner = useRef<string | null>(null),
    associationRef = useRef(association);
  associationRef.current = association;
  const api = (path: string, data?: unknown, method?: string) =>
    requestApi(path, data, method, owner.current);
  const current = (ticket: number) => alive.current && ticket === epoch.current;
  function clearIdentity() {
    owner.current = null;
    setEmail(null);
    setRows([]);
    setPending([]);
    setModerator(false);
    setSubmission(null);
    setConflict(false);
    onAssociation?.(null);
  }
  async function load(ticket: number) {
    const session = await api('/api/auth/get-session');
    if (!current(ticket)) return;
    const user = record(session) && record(session.user) ? session.user : null;
    const identity =
      user && typeof user.id === 'string'
        ? user.id
        : user && typeof user.email === 'string'
          ? user.email
          : null;
    if (
      (owner.current && owner.current !== identity) ||
      (associationRef.current && associationRef.current.owner !== identity)
    ) {
      clearIdentity();
      onSignOut();
    }
    owner.current = identity;
    setEmail(user && typeof user.email === 'string' ? user.email : null);
    const items = explore
      ? readAccountPrompts(await api('/api/library?q=' + encodeURIComponent(query)))
      : identity
        ? readAccountPrompts(await api('/api/prompts'))
        : [];
    if (!current(ticket)) return;
    setRows(items);
    if (identity && !explore) {
      const permission = await api('/api/moderation');
      if (!current(ticket)) return;
      const allowed = record(permission) && permission.moderator === true;
      setModerator(allowed);
      if (allowed) {
        const queue = readAccountPrompts(await api('/api/pending'));
        if (current(ticket)) setPending(queue);
      }
    }
  }
  useEffect(() => {
    alive.current = true;
    const ticket = ++epoch.current;
    setBusy(true);
    setRows([]);
    setPending([]);
    setModerator(false);
    void (async () => {
      try {
        const config = await api('/api/config');
        if (!current(ticket)) return;
        setGoogle(record(config) && config.googleEnabled === true);
        await load(ticket);
        if (current(ticket)) setStatus('');
      } catch (error) {
        if (current(ticket)) {
          if (error instanceof ApiError && error.status === 401) {
            clearIdentity();
            onSignOut();
          }
          setStatus(error instanceof Error ? error.message : 'Account service unavailable.');
        }
      } finally {
        if (current(ticket)) setBusy(false);
      }
    })();
    return () => {
      alive.current = false;
      ++epoch.current;
    };
  }, [explore]);
  async function run(action: (ticket: number) => Promise<void>) {
    if (busy) return;
    const ticket = ++epoch.current;
    setBusy(true);
    setStatus('');
    try {
      if (owner.current) {
        const session = await api('/api/auth/get-session');
        if (!current(ticket)) return;
        const user = record(session) && record(session.user) ? session.user : null;
        const identity =
          user && typeof user.id === 'string'
            ? user.id
            : user && typeof user.email === 'string'
              ? user.email
              : null;
        if (identity !== owner.current) {
          clearIdentity();
          onSignOut();
          await load(ticket);
          if (current(ticket))
            setStatus('Your account changed. Review the current account before trying again.');
          return;
        }
      }
      await action(ticket);
    } catch (error) {
      if (current(ticket)) {
        if (error instanceof ApiError && error.status === 409) {
          setConflict(true);
          setStatus(
            'This prompt changed on another device. Your draft is preserved. Reload the cloud version only when ready to replace this draft.',
          );
        } else if (error instanceof ApiError && error.status === 401) {
          clearIdentity();
          onSignOut();
          setStatus('Your session ended. Sign in again.');
        } else setStatus(error instanceof Error ? error.message : 'The request failed.');
      }
    } finally {
      if (current(ticket)) setBusy(false);
    }
  }
  function open(row: Row) {
    const link =
      !explore && row.status === 'private' && row.revision && owner.current
        ? { owner: owner.current, id: row.id, revision: row.revision }
        : undefined;
    if (link) onOpen(snapshot(row), link);
    else onOpen(snapshot(row));
  }
  const linked = association && association.owner === owner.current ? association : null;
  async function save(kind: 'private' | 'pending', ticket: number) {
    const definition = kind === 'pending' ? submission?.template : template;
    if (!definition || (kind === 'pending' && !consent)) return;
    const saved = readAccountPrompts([
      await api('/api/prompts', {
        title: definition.title,
        description: definition.description,
        body: definition.body,
        status: kind,
        ...(kind === 'pending' ? { consent: true } : {}),
      }),
    ])[0];
    if (!current(ticket)) return;
    if (kind === 'private' && saved.revision && owner.current)
      onAssociation?.({ owner: owner.current, id: saved.id, revision: saved.revision });
    setSubmission(null);
    setConsent(false);
    await load(ticket);
    if (current(ticket))
      setStatus(
        kind === 'private'
          ? 'Private template copy saved. Pasted input was excluded.'
          : 'Template submitted for review. It is not public yet. Pasted input was excluded.',
      );
  }
  return (
    <div className="account-library">
      <p className="muted">
        {explore
          ? 'Open an approved prompt as an independent, temporary copy.'
          : 'Cloud prompts are private to your account. Nothing uploads automatically. Pasted values stay on this device.'}
      </p>
      {!explore &&
        !email &&
        (google ? (
          <Button
            disabled={busy}
            onClick={() =>
              void run(async (ticket) => {
                const result = await api('/api/auth/sign-in/social', {
                  provider: 'google',
                  callbackURL: window.location.origin,
                });
                if (current(ticket) && record(result) && typeof result.url === 'string')
                  window.location.assign(result.url);
              })
            }
          >
            Continue with Google
          </Button>
        ) : (
          <p>Google sign-in is not configured. You can keep using prompts locally for free.</p>
        ))}
      {!explore && email && (
        <>
          <div className="account-actions">
            <p>Signed in as {email}</p>
            <Button
              disabled={busy}
              variant="outline"
              onClick={() =>
                void run(async (ticket) => {
                  await api('/api/auth/sign-out', {});
                  if (current(ticket)) {
                    clearIdentity();
                    onSignOut();
                    setStatus('Signed out.');
                  }
                })
              }
            >
              Sign out
            </Button>
          </div>
          <section aria-label="Save current template">
            <h3>Current template: {template.title}</h3>
            <p>
              Only the reusable template is sent. Pasted field values and device settings are
              excluded.
            </p>
            <div className="account-actions">
              <Button disabled={busy} onClick={() => void run((ticket) => save('private', ticket))}>
                Save private copy
              </Button>
              {linked && (
                <Button
                  disabled={busy || conflict}
                  onClick={() =>
                    void run(async (ticket) => {
                      const row = readAccountPrompts([
                        await api(
                          '/api/prompts/' + encodeURIComponent(linked.id),
                          {
                            title: template.title,
                            description: template.description,
                            body: template.body,
                            revision: linked.revision,
                          },
                          'PUT',
                        ),
                      ])[0];
                      if (current(ticket) && row.revision) {
                        onAssociation?.({ ...linked, revision: row.revision });
                        await load(ticket);
                        if (current(ticket)) setStatus('Cloud prompt updated.');
                      }
                    })
                  }
                >
                  Update cloud prompt
                </Button>
              )}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setSubmission(snapshot(template));
                  setConsent(false);
                }}
              >
                Submit for community review
              </Button>
            </div>
          </section>
          {conflict && linked && (
            <Button
              disabled={busy}
              variant="outline"
              onClick={() =>
                void run(async (ticket) => {
                  const items = readAccountPrompts(await api('/api/prompts')),
                    row = items.find((item) => item.id === linked.id);
                  if (!row)
                    throw new Error('This cloud prompt no longer exists. Your draft is preserved.');
                  if (current(ticket)) {
                    setConflict(false);
                    open(row);
                  }
                })
              }
            >
              Reload cloud version and replace draft
            </Button>
          )}
          <Field>
            <FieldLabel htmlFor="community-upload">Submit a single-prompt sharing file</FieldLabel>
            <Input
              id="community-upload"
              type="file"
              accept=".json,application/json"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                void run(async (ticket) => {
                  if (file.size > SHARE_FILE_LIMIT)
                    throw new Error('The sharing file is too large.');
                  const parsed = readSnapshot(await file.text());
                  if (current(ticket)) {
                    setSubmission({
                      format: 'promptroom-share',
                      version: 1,
                      template: parsed.template,
                    });
                    setConsent(false);
                  }
                });
              }}
            />
          </Field>
          {submission && (
            <section aria-label="Publication preview">
              <h3>{submission.template.title}</h3>
              <p>{submission.template.description}</p>
              <pre className="whitespace-pre-wrap">{submission.template.body}</pre>
              <p>Pasted values are excluded. Submissions await moderator approval.</p>
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />{' '}
                I have the right to publish this template and dedicate it under CC0.
              </label>
              <div className="account-actions">
                <Button
                  disabled={busy || !consent}
                  onClick={() => void run((ticket) => save('pending', ticket))}
                >
                  Confirm publication request
                </Button>
                <Button variant="ghost" onClick={() => setSubmission(null)}>
                  Cancel submission
                </Button>
              </div>
            </section>
          )}
        </>
      )}
      {(explore || email) && (
        <>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run((ticket) => load(ticket));
            }}
          >
            <Field>
              <FieldLabel htmlFor="account-search">
                {explore ? 'Search community prompts' : 'Search account prompts'}
              </FieldLabel>
              <Input
                id="account-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
            <div className="account-actions">
              <Button disabled={busy}>Search</Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void run((ticket) => load(ticket))}
              >
                Refresh cloud list
              </Button>
            </div>
          </form>
          <div className="account-prompt-list">
            {rows
              .filter(
                (row) =>
                  explore ||
                  (row.title + ' ' + row.description).toLowerCase().includes(query.toLowerCase()),
              )
              .map((row) => (
                <article key={row.id}>
                  <h3>{row.title}</h3>
                  <p>{row.description}</p>
                  <p>
                    {row.status === 'pending'
                      ? 'Awaiting review'
                      : row.status === 'private'
                        ? 'Private to your account'
                        : 'Published'}
                  </p>
                  <div className="account-actions">
                    <Button disabled={busy} variant="outline" onClick={() => open(row)}>
                      Open in workbench
                    </Button>
                    {(explore || row.status === 'approved') && (
                      <a href={'/p/' + encodeURIComponent(row.id)}>Permanent prompt page</a>
                    )}
                    {!explore && row.status === 'private' && row.revision && (
                      <Button
                        disabled={busy}
                        variant="outline"
                        onClick={() =>
                          void run(async (ticket) => {
                            if (
                              !window.confirm(
                                'Delete this cloud prompt? Your open draft will be kept.',
                              )
                            )
                              return;
                            await api(
                              '/api/prompts/' + encodeURIComponent(row.id),
                              { revision: row.revision },
                              'DELETE',
                            );
                            if (!current(ticket)) return;
                            if (association?.id === row.id) onAssociation?.(null);
                            await load(ticket);
                          })
                        }
                      >
                        Delete {row.title}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
          </div>
          {!rows.length && !busy && (
            <p>
              {explore
                ? 'No approved community prompts yet.'
                : 'No account copies yet. Save your current template to start.'}
            </p>
          )}
        </>
      )}
      {moderator && (
        <section aria-label="Moderation">
          <h3>Community moderation</h3>
          {pending.map((row) => (
            <article key={row.id}>
              <h4>{row.title}</h4>
              <p>{row.description}</p>
              <pre className="whitespace-pre-wrap">{row.body}</pre>
              <div className="account-actions">
                {['approve', 'reject'].map((action) => (
                  <Button
                    key={action}
                    disabled={busy}
                    onClick={() =>
                      void run(async (ticket) => {
                        await api('/api/' + action, { id: row.id });
                        if (current(ticket)) await load(ticket);
                      })
                    }
                  >
                    {action === 'approve' ? 'Approve' : 'Reject'} {row.title}
                  </Button>
                ))}
              </div>
            </article>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget,
                id = String(new FormData(form).get('id') ?? '');
              void run(async (ticket) => {
                await api('/api/unpublish', { id });
                if (current(ticket)) {
                  form.reset();
                  await load(ticket);
                  setStatus('Prompt removed from public visibility.');
                }
              });
            }}
          >
            <Field>
              <FieldLabel htmlFor="unpublish-id">Published prompt ID to remove</FieldLabel>
              <Input id="unpublish-id" name="id" required />
            </Field>
            <Button disabled={busy}>Remove published prompt</Button>
          </form>
        </section>
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
