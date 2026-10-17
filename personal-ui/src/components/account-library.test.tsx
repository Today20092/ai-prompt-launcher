// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AccountLibrary, { readAccountPrompts } from './AccountLibrary';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const template = {
  id: 'local',
  title: 'Grammar',
  description: 'Private reusable template',
  body: 'Correct this: {{text}}',
};

test('an account changed in another tab cannot receive the previous account draft', async () => {
  let identity = 'first';
  const writes: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      if (options.method === 'POST') writes.push(path);
      return {
        ok: true,
        json: async () =>
          path === '/api/config'
            ? { googleEnabled: true }
            : path.includes('get-session')
              ? { user: { id: identity, email: identity + '@example.invalid' } }
              : path === '/api/moderation'
                ? { moderator: false }
                : options.method === 'POST'
                  ? { ...template, status: 'private', revision: 1 }
                  : [],
      };
    }),
  );
  render(
    <AccountLibrary explore={false} template={template} onOpen={() => {}} onSignOut={() => {}} />,
  );
  await waitFor(() => expect(screen.getByText('Signed in as first@example.invalid')).toBeTruthy());
  identity = 'second';
  fireEvent.click(screen.getByText('Save private copy'));
  await waitFor(() => expect(screen.getByText('Signed in as second@example.invalid')).toBeTruthy());
  expect(writes).toEqual([]);
});
test('saving a private copy sends only the reusable template and requires an explicit click', async () => {
  const calls: Array<{ path: string; body: unknown }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      calls.push({ path, body: options.body ? JSON.parse(String(options.body)) : undefined });
      return {
        ok: true,
        json: async () =>
          path === '/api/config'
            ? { googleEnabled: true }
            : path === '/api/moderation'
              ? { moderator: false }
              : path.includes('get-session')
                ? { user: { id: 'user', email: 'test@example.invalid' } }
                : path === '/api/prompts' && options.method === 'POST'
                  ? { ...template, id: 'saved', status: 'private', revision: 1 }
                  : [],
      };
    }),
  );
  render(
    <AccountLibrary explore={false} template={template} onOpen={() => {}} onSignOut={() => {}} />,
  );
  await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeTruthy());
  expect(calls.filter((c) => c.body)).toHaveLength(0);
  fireEvent.click(screen.getByText('Save private copy'));
  await waitFor(() => expect(screen.getByText(/Private template copy saved/)).toBeTruthy());
  expect(calls.find((c) => c.body)?.body).toEqual({
    title: template.title,
    description: template.description,
    body: template.body,
    status: 'private',
  });
});
test('explore opens a plain temporary template copy without writing to the account', async () => {
  const open = vi.fn();
  const fetcher = vi.fn(async (path: string) => ({
    ok: true,
    json: async () =>
      path === '/api/config'
        ? { googleEnabled: true }
        : path.includes('get-session')
          ? null
          : [{ ...template, id: 'public' }],
  }));
  vi.stubGlobal('fetch', fetcher);
  render(<AccountLibrary explore template={template} onOpen={open} onSignOut={() => {}} />);
  await waitFor(() => expect(screen.getByText('Open in workbench')).toBeTruthy());
  fireEvent.click(screen.getByText('Open in workbench'));
  expect(open).toHaveBeenCalledWith({
    format: 'promptroom-share',
    version: 1,
    template: { title: template.title, description: template.description, body: template.body },
  });
  expect(fetcher.mock.calls.every(([path]) => path.startsWith('/api/'))).toBe(true);
});
test('malformed account results are rejected before display', () => {
  expect(() => readAccountPrompts([{ id: 'bad', title: 'Bad' }])).toThrow();
});

test('guest login uses Google only when configured', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => ({
      ok: true,
      json: async () => (path === '/api/config' ? { googleEnabled: false } : null),
    })),
  );
  render(
    <AccountLibrary explore={false} template={template} onOpen={() => {}} onSignOut={() => {}} />,
  );
  await waitFor(() => expect(screen.getByText(/Google sign-in is not configured/)).toBeTruthy());
  expect(screen.queryByLabelText('Password')).toBeNull();
});

test('stale updates preserve the draft and require explicit reload', async () => {
  const open = vi.fn(),
    associate = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => ({
      ok: options.method !== 'PUT',
      status: options.method === 'PUT' ? 409 : 200,
      json: async () =>
        options.method === 'PUT'
          ? { error: 'Conflict' }
          : path === '/api/config'
            ? { googleEnabled: true }
            : path.includes('get-session')
              ? { user: { id: 'owner', email: 'test@example.invalid' } }
              : path === '/api/moderation'
                ? { moderator: false }
                : [
                    {
                      ...template,
                      id: 'cloud',
                      body: 'New cloud text',
                      status: 'private',
                      revision: 3,
                    },
                  ],
    })),
  );
  render(
    <AccountLibrary
      explore={false}
      template={template}
      association={{ owner: 'owner', id: 'cloud', revision: 1 }}
      onAssociation={associate}
      onOpen={open}
      onSignOut={() => {}}
    />,
  );
  await waitFor(() =>
    expect(screen.getByText('Update cloud prompt').hasAttribute('disabled')).toBe(false),
  );
  fireEvent.click(screen.getByText('Update cloud prompt'));
  await waitFor(() => expect(screen.getByText(/Your draft is preserved/)).toBeTruthy());
  expect(open).not.toHaveBeenCalled();
  expect(associate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Reload cloud version and replace draft'));
  await waitFor(() =>
    expect(open).toHaveBeenCalledWith(
      {
        format: 'promptroom-share',
        version: 1,
        template: {
          title: 'Grammar',
          description: 'Private reusable template',
          body: 'New cloud text',
        },
      },
      { owner: 'owner', id: 'cloud', revision: 3 },
    ),
  );
});

test('publication requires consent and excludes values from sharing files', async () => {
  const writes: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      if (options.body) writes.push(JSON.parse(String(options.body)));
      return {
        ok: true,
        json: async () =>
          path === '/api/config'
            ? { googleEnabled: true }
            : path.includes('get-session')
              ? { user: { id: 'owner', email: 'test@example.invalid' } }
              : path === '/api/moderation'
                ? { moderator: false }
                : options.method === 'POST'
                  ? { ...template, id: 'pending', status: 'pending', revision: 1 }
                  : [],
      };
    }),
  );
  render(
    <AccountLibrary explore={false} template={template} onOpen={() => {}} onSignOut={() => {}} />,
  );
  await waitFor(() => expect(screen.getByText(/Signed in as/)).toBeTruthy());
  const file = new File(['unused'], 'prompt.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: async () =>
      JSON.stringify({
        format: 'promptroom-share',
        version: 1,
        template: { title: 'Upload', description: 'File', body: 'Use {{text}}' },
        values: { text: 'SECRET' },
      }),
  });
  fireEvent.change(screen.getByLabelText('Submit a single-prompt sharing file'), {
    target: { files: [file] },
  });
  await waitFor(() => expect(screen.getByText('Upload')).toBeTruthy());
  expect(screen.queryByText('SECRET')).toBeNull();
  expect(screen.getByText('Confirm publication request').hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByText('Confirm publication request'));
  await waitFor(() =>
    expect(writes).toEqual([
      {
        title: 'Upload',
        description: 'File',
        body: 'Use {{text}}',
        status: 'pending',
        consent: true,
      },
    ]),
  );
});

test('refreshing after an identity change clears the previous account association', async () => {
  let identity = 'first';
  const associate = vi.fn(),
    signOut = vi.fn();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => ({
      ok: true,
      json: async () =>
        path === '/api/config'
          ? { googleEnabled: true }
          : path.includes('get-session')
            ? { user: { id: identity, email: identity + '@example.invalid' } }
            : path === '/api/moderation'
              ? { moderator: false }
              : identity === 'first'
                ? [
                    {
                      ...template,
                      id: 'cloud',
                      title: 'First account secret',
                      status: 'private',
                      revision: 1,
                    },
                  ]
                : [],
    })),
  );
  render(
    <AccountLibrary
      explore={false}
      template={template}
      association={{ owner: 'first', id: 'cloud', revision: 1 }}
      onAssociation={associate}
      onOpen={() => {}}
      onSignOut={signOut}
    />,
  );
  await waitFor(() => expect(screen.getByText('First account secret')).toBeTruthy());
  identity = 'second';
  fireEvent.click(screen.getByText('Refresh cloud list'));
  await waitFor(() => expect(screen.getByText('Signed in as second@example.invalid')).toBeTruthy());
  expect(screen.queryByText('First account secret')).toBeNull();
  expect(associate).toHaveBeenCalledWith(null);
  expect(signOut).toHaveBeenCalled();
});

test('private deletion uses the displayed revision and detaches the open draft', async () => {
  const associate = vi.fn(),
    confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  let removed = false;
  let deletion: unknown;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, options: RequestInit) => {
      if (options.method === 'DELETE') {
        deletion = JSON.parse(String(options.body));
        removed = true;
      }
      return {
        ok: true,
        json: async () =>
          path === '/api/config'
            ? { googleEnabled: true }
            : path.includes('get-session')
              ? { user: { id: 'owner', email: 'owner@example.invalid' } }
              : path === '/api/moderation'
                ? { moderator: false }
                : options.method === 'DELETE'
                  ? { ok: true }
                  : removed
                    ? []
                    : [{ ...template, id: 'cloud', status: 'private', revision: 4 }],
      };
    }),
  );
  render(
    <AccountLibrary
      explore={false}
      template={template}
      association={{ owner: 'owner', id: 'cloud', revision: 4 }}
      onAssociation={associate}
      onOpen={() => {}}
      onSignOut={() => {}}
    />,
  );
  await waitFor(() => expect(screen.getByText('Delete Grammar')).toBeTruthy());
  fireEvent.click(screen.getByText('Delete Grammar'));
  await waitFor(() => expect(screen.queryByText('Delete Grammar')).toBeNull());
  expect(deletion).toEqual({ revision: 4 });
  expect(associate).toHaveBeenCalledWith(null);
  confirm.mockRestore();
});
