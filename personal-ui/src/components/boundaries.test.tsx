// @vitest-environment jsdom
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BackupControls from './BackupControls';
import ShareControls from './ShareControls';
import Workbench from './Workbench';
import { exportBackup } from '../lib/backup';
import { createSnapshot } from '../lib/sharing';
import { newWorkspace, WorkspaceStore, WORKSPACE_KEY } from '../lib/workspace';
import { receiveTransfer, sendTransfer } from '../lib/device-transfer';

vi.mock('../lib/device-transfer', async importOriginal => ({ ...await importOriginal<typeof import('../lib/device-transfer')>(), receiveTransfer: vi.fn(), sendTransfer: vi.fn() }));

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
  fireEvent.click(screen.getByRole('button', { name: /Preview complete prompt/ }));
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

test('selecting an invalid file supersedes copying and leaves copy actions usable', async () => {
  const pending = deferred<void>();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => pending.promise } });
  render(<ShareControls template={newWorkspace().templates[0]} values={{}} onReceived={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  fireEvent.click(screen.getByRole('button', { name: 'Copy template' }));
  fireEvent.click(screen.getByText('Transfer a template file'));
  choose('Open single-prompt JSON', Promise.resolve('invalid synthetic JSON'));
  await screen.findByText(/This shared prompt is invalid/);
  expect((screen.getByRole('button', { name: 'Copy template' }) as HTMLButtonElement).disabled).toBe(false);
  await act(async () => pending.resolve());
  expect(screen.queryByText('Unfilled template copied.')).toBeNull();
});

test('template editor shows validation, then saves through the form', async () => {
  render(<Workbench />);
  fireEvent.click(await screen.findByRole('button', { name: 'New prompt' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
  await screen.findByText('Give your prompt a name.');
  expect(document.activeElement).toBe(screen.getByLabelText('Name'));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic saved' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
  await screen.findByRole('heading', { name: 'Synthetic saved' });
  expect(screen.queryByText('Give your prompt a name.')).toBeNull();
  // Select triggers stay named by their field labels and show labels rather than raw values.
  expect(screen.getByRole('combobox', { name: 'Chat app' }).textContent).toContain('(preferred)');
});

test('expanding the template editor keeps the same draft, selection and scroll position', async () => {
  render(<Workbench />);
  fireEvent.click(await screen.findByRole('button', { name: 'New prompt' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic long template' } });
  const body = screen.getByLabelText<HTMLTextAreaElement>('Template');
  const text = 'Synthetic paragraph with {{text}}.\n'.repeat(100);
  fireEvent.change(body, { target: { value: text } });
  body.setSelectionRange(20, 30);
  body.scrollTop = 100;
  fireEvent.click(screen.getByRole('button', { name: 'Expand editor' }));
  expect(screen.getByLabelText('Template')).toBe(body);
  expect(body.value).toBe(text);
  expect([body.selectionStart, body.selectionEnd, body.scrollTop]).toEqual([20, 30, 100]);
  expect(screen.getByRole('button', { name: 'Collapse editor' }).getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Collapse editor' }));
  expect(body.value).toBe(text);
  fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
  await screen.findByRole('heading', { name: 'Synthetic long template' });
  fireEvent.click(screen.getByRole('button', { name: 'Prompt actions' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit template' }));
  expect(screen.getByLabelText<HTMLTextAreaElement>('Template').value).toBe(text);
  expect(screen.getByRole('button', { name: 'Expand editor' }).getAttribute('aria-expanded')).toBe('false');
});

test('preview opens on first use, remembers each prompt choice, and reopens after editing', async () => {
  render(<Workbench />);
  const preview = () => screen.getByRole('button', { name: /Preview complete prompt/ });
  expect(preview().getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(preview());
  expect(preview().getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: /^Transcript cleanup/ }));
  expect(preview().getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /^Grammar corrector/ }));
  expect(preview().getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Prompt actions' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit template' }));
  fireEvent.change(screen.getByLabelText('Template'), { target: { value: 'Synthetic changed instruction: {{text}}' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save template' }));
  await screen.findByText('Synthetic changed instruction: {{text}}');
  expect(preview().getAttribute('aria-expanded')).toBe('true');
});

test('temporary input guidance stays associated with the field and its validation error', () => {
  render(<Workbench />);
  const input = screen.getByLabelText('Your text');
  expect(input.getAttribute('aria-describedby')).toContain('input-note-0');
  expect(document.getElementById('input-note-0')?.textContent).toBe("Input is temporary and isn't saved.");
  fireEvent.click(screen.getByRole('button', { name: 'Copy prompt' }));
  expect(input.getAttribute('aria-describedby')).toContain('input-note-0');
  expect(input.getAttribute('aria-describedby')).toContain('error-0');
  expect(document.getElementById('error-0')?.textContent).toBe('Enter your text.');
  expect(document.activeElement).toBe(input);
  const app = screen.getByRole('combobox', { name: 'Chat app' });
  expect(app.getAttribute('aria-describedby')).toContain('chat-app-help');
});

test('management popups expose the original workspace and prompt controls', async () => {
  render(<Workbench />);
  const workspace = screen.getByRole('button', { name: 'Workspace' });
  expect(workspace.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('button', { name: 'Preferences' })).toBeNull();
  fireEvent.click(workspace);
  expect(workspace.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('button', { name: 'Transfer between devices' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Preferences' }));
  expect(await screen.findByRole('heading', { name: 'Preferences' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  const actions = screen.getByRole('button', { name: 'Prompt actions' });
  fireEvent.click(actions);
  expect(actions.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add favorite' }));
  expect(screen.getByRole('button', { name: 'Remove favorite' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Edit template' })).toBeTruthy();
});

test('action popups are portaled and Escape restores their trigger focus', async () => {
  const view = render(<Workbench />);
  for (const name of ['Workspace', 'Prompt actions']) {
    const trigger = screen.getByRole('button', { name });
    fireEvent.click(trigger);
    const popup = await screen.findByRole('dialog', { name: name === 'Workspace' ? 'Workspace actions' : name });
    expect(view.container.contains(popup)).toBe(false);
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  }
});

test('dialogs launched from action popups restore the visible toolbar trigger', async () => {
  render(<Workbench />);
  for (const [group, action, title] of [
    ['Workspace', 'Preferences', 'Preferences'],
    ['Workspace', 'Transfer between devices', 'Transfer between devices'],
    ['Prompt actions', 'Edit template', 'Edit template'],
    ['Prompt actions', 'Share', 'Share prompt'],
  ]) {
    const trigger = screen.getByRole('button', { name: group });
    if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: action }));
    const dialog = await screen.findByRole('dialog', { name: title });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  }
});

test('transfer invitations open their dialog while workspace controls stay collapsed', async () => {
  window.history.replaceState(null, '', '#transfer=tcSyntheticInitial');
  render(<Workbench />);
  expect((await screen.findByLabelText<HTMLInputElement>('Receiver invitation link or address')).value).toBe('tcSyntheticInitial');
  expect(screen.getByRole('button', { name: 'Workspace', hidden: true }).getAttribute('aria-expanded')).toBe('false');
  expect(window.location.hash).toBe('');
  fireEvent.click(screen.getByText('Close', { selector: 'button' }));
  await act(async () => {
    window.history.replaceState(null, '', '#transfer=tcSyntheticLater');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  expect((await screen.findByLabelText<HTMLInputElement>('Receiver invitation link or address')).value).toBe('tcSyntheticLater');
  expect(screen.getByRole('button', { name: 'Workspace', hidden: true }).getAttribute('aria-expanded')).toBe('false');
  expect(window.location.hash).toBe('');
  expect(sendTransfer).not.toHaveBeenCalled();
  expect(receiveTransfer).not.toHaveBeenCalled();
});
