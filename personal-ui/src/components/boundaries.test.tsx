// @vitest-environment jsdom
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import BackupControls from './BackupControls';
import ShareControls from './ShareControls';
import Workbench from './Workbench';
import { exportBackup } from '../lib/backup';
import { createSnapshot } from '../lib/sharing';
import { newWorkspace, WorkspaceStore, WORKSPACE_KEY } from '../lib/workspace';

beforeEach(() => {
  const saved = new Map<string, string>();
  const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value), clear: () => saved.clear() };
  // Node 26 has its own optional localStorage. Explicitly use synthetic browser storage.
  vi.stubGlobal('localStorage', storage);
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  for (const key of ['clipboard', 'share', 'canShare']) Reflect.deleteProperty(navigator, key);
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}
function backup(title: string) {
  const workspace = newWorkspace();
  workspace.templates.push({ id: title, title, description: '', body: 'Synthetic reusable prompt' });
  return exportBackup(workspace);
}
function choose(label: string, promise: Promise<string>) {
  fireEvent.change(screen.getByLabelText(label), { target: { files: [{ size: 1, text: () => promise }] } });
}

test('cancelled backup read cannot become a review after reopening', async () => {
  const store = new WorkspaceStore(() => localStorage); store.load();
  const onImported = vi.fn();
  const pending = deferred<string>();
  render(<BackupControls workspace={store.data} store={store} onImported={onImported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Import backup' }));
  choose('JSON backup', pending.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await act(async () => pending.resolve(backup('Obsolete')));
  fireEvent.click(screen.getByRole('button', { name: 'Import backup' }));
  expect((screen.getByRole('button', { name: 'Apply import' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText('Obsolete')).toBeNull();
  expect(onImported).not.toHaveBeenCalled();
});

test('a newer file replaces older completion and a changed workspace invalidates review', async () => {
  const store = new WorkspaceStore(() => localStorage); store.load();
  const onImported = vi.fn();
  const pending = deferred<string>();
  const view = render(<BackupControls workspace={store.data} store={store} onImported={onImported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Import backup' }));
  choose('JSON backup', pending.promise);
  choose('JSON backup', Promise.resolve(backup('Latest')));
  await screen.findByText('Latest');
  await act(async () => pending.resolve(backup('Obsolete')));
  expect(screen.queryByText('Obsolete')).toBeNull();
  const saved = localStorage.getItem(WORKSPACE_KEY);
  store.save({ ...store.data, preferredApp: 'Claude' });
  view.rerender(<BackupControls workspace={store.data} store={store} onImported={onImported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Apply import' }));
  expect(onImported).not.toHaveBeenCalled();
  expect(store.data.templates.some(item => item.title === 'Latest')).toBe(false);
  expect(localStorage.getItem(WORKSPACE_KEY)).not.toBe(saved);
  choose('JSON backup', Promise.resolve(backup('Latest')));
  await screen.findByText('Latest');
  fireEvent.click(screen.getByRole('button', { name: 'Apply import' }));
  expect(onImported).toHaveBeenCalledTimes(1);
  expect(store.data.templates.filter(item => item.title === 'Latest')).toHaveLength(1);
});

test('closed share dialog and disposed receiver ignore pending browser completions', async () => {
  const template = newWorkspace().templates[0];
  const clipboard = deferred<void>();
  const writeText = vi.fn(() => clipboard.promise);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const onReceived = vi.fn();
  const view = render(<ShareControls template={template} values={{ text: 'Synthetic private value' }} onReceived={onReceived} />);
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  fireEvent.click(screen.getByRole('button', { name: 'Copy template' }));
  fireEvent.click(screen.getByRole('button', { name: 'Copy template' }));
  expect(writeText).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await act(async () => clipboard.resolve());
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  expect(screen.queryByText('Unfilled template copied.')).toBeNull();
  fireEvent.click(screen.getByText('Transfer a template file'));
  const file = deferred<string>();
  choose('Open single-prompt JSON', file.promise);
  view.unmount();
  await act(async () => file.resolve(JSON.stringify(createSnapshot(template, {}))));
  expect(onReceived).not.toHaveBeenCalled();
});

test('provider fallback event opens before clipboard and denied copying shows full manual text', async () => {
  const calls: string[] = [];
  const prompt = 'Synthetic 🐱 &?#%+\n'.repeat(300);
  const destination = { opener: 'old', location: { replace: vi.fn() }, close: vi.fn() };
  vi.spyOn(window, 'open').mockImplementation(() => { calls.push('open'); return destination as unknown as Window; });
  const denied = deferred<void>();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn((text: string) => { calls.push('copy'); expect(text).toContain(prompt); return denied.promise; }) } });
  render(<Workbench />);
  fireEvent.change(screen.getByLabelText('Your text'), { target: { value: prompt } });
  fireEvent.click(screen.getByRole('button', { name: 'Open in T3 Chat' }));
  expect(calls).toEqual(['open', 'copy']);
  // Reject through the browser capability, rather than throwing through React.
  await act(async () => { denied.reject(new Error('Clipboard denied')); });
  expect(destination.location.replace).not.toHaveBeenCalled();
  expect(destination.close).toHaveBeenCalledOnce();
  expect(screen.getByText(/Clipboard access failed/)).toBeTruthy();
  expect(screen.getByLabelText('Complete prompt').textContent).toContain(prompt);
});

test('native sharing begins synchronously and closing its dialog suppresses late status', async () => {
  const pending = deferred<void>();
  const share = vi.fn(() => pending.promise);
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  render(<ShareControls template={newWorkspace().templates[0]} values={{}} onReceived={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  fireEvent.click(screen.getByRole('button', { name: 'Device share menu' }));
  expect(share).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await act(async () => pending.resolve());
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  expect(screen.queryByText('Link handed to the device share menu.')).toBeNull();
});
