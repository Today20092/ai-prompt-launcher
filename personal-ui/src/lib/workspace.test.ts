import { expect, test } from 'vitest';
import { exportBackup, planImport, readBackup } from './backup';
import { WORKSPACE_KEY, WorkspaceStore, newWorkspace } from './workspace';

function browserStorage(initial: string | null = null) {
  let value = initial;
  let fail = false;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, next: string) => { if (fail) throw new Error('Quota exceeded'); value = next; },
    failWrites: (next: boolean) => { fail = next; },
  };
}

test('a failed import preserves session and saved data and can be retried after freeing space', () => {
  const storage = browserStorage();
  const store = new WorkspaceStore(() => storage);
  store.load();
  const before = structuredClone(store.data);
  const saved = storage.getItem(WORKSPACE_KEY);
  const incoming = newWorkspace();
  incoming.templates.push({ id: 'custom', title: 'Custom', description: '', body: 'Summarize {{text}}' });
  const plan = planImport(store.data, readBackup(exportBackup(incoming)));
  storage.failWrites(true);
  expect(store.importWorkspace(plan.next)).toBe(false);
  expect(store.data).toEqual(before);
  expect(storage.getItem(WORKSPACE_KEY)).toBe(saved);
  expect(store.message).toContain('Import failed');
  storage.failWrites(false);
  expect(store.importWorkspace(plan.next)).toBe(true);
  const reopened = new WorkspaceStore(() => storage);
  expect(reopened.load().templates.map(item => item.id)).toEqual(['grammar', 'transcript', 'custom']);
});

test('another tab changing storage blocks import without overwriting either workspace', () => {
  const storage = browserStorage();
  const first = new WorkspaceStore(() => storage);
  const second = new WorkspaceStore(() => storage);
  first.load();
  second.load();
  const before = structuredClone(first.data);
  const incoming = newWorkspace();
  incoming.templates.push({ id: 'new', title: 'New', description: '', body: 'New tool' });
  const plan = planImport(first.data, incoming);
  second.save({ ...second.data, preferredApp: 'Claude' });
  expect(first.importWorkspace(plan.next)).toBe(false);
  expect(first.data).toEqual(before);
  expect(new WorkspaceStore(() => storage).load().preferredApp).toBe('Claude');
  expect(first.message).toContain('another tab');
});

test('corrupt or unavailable storage cannot be replaced by an import', () => {
  for (const raw of ['{broken', JSON.stringify({ version: 99 })]) {
    const storage = browserStorage(raw);
    const store = new WorkspaceStore(() => storage);
    store.load();
    const before = structuredClone(store.data);
    expect(store.importWorkspace(newWorkspace())).toBe(false);
    expect(store.data).toEqual(before);
    expect(storage.getItem(WORKSPACE_KEY)).toBe(raw);
  }
  const denied = new WorkspaceStore(() => { throw new Error('Access denied'); });
  denied.load();
  const before = structuredClone(denied.data);
  expect(denied.canRestorePreferences).toBe(false);
  expect(denied.importWorkspace(newWorkspace())).toBe(false);
  expect(denied.data).toEqual(before);
});

test('only a fresh untouched workspace restores imported preferences', () => {
  const storage = browserStorage();
  const store = new WorkspaceStore(() => storage);
  store.load();
  const incoming = newWorkspace();
  incoming.preferredApp = 'Claude';
  incoming.lastUsedPrompt = 'transcript';
  expect(store.canRestorePreferences).toBe(true);
  const plan = planImport(store.data, incoming, store.canRestorePreferences);
  expect(plan.next.preferredApp).toBe('Claude');
  expect(plan.next.lastUsedPrompt).toBe('transcript');
  expect(store.importWorkspace(plan.next)).toBe(true);
  expect(store.canRestorePreferences).toBe(false);
  const reopened = new WorkspaceStore(() => storage);
  reopened.load();
  expect(reopened.canRestorePreferences).toBe(false);
  const emptyStorage = browserStorage();
  const untouched = new WorkspaceStore(() => emptyStorage);
  untouched.load();
  untouched.save({ ...untouched.data, preferredApp: 'ChatGPT' });
  expect(untouched.canRestorePreferences).toBe(false);
});
