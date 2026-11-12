// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import DeviceTransfer from './DeviceTransfer';
import { receiveTransfer, sendTransfer } from '../lib/device-transfer';
import { exportBackup } from '../lib/backup';
import { newWorkspace, WorkspaceStore } from '../lib/workspace';

vi.mock('../lib/device-transfer', async importOriginal => ({ ...await importOriginal<typeof import('../lib/device-transfer')>(), receiveTransfer: vi.fn(), sendTransfer: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function store() {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const result = new WorkspaceStore(() => storage); result.load();
  return { result, storage };
}

test('receiver confirms pairing and reviews a safe merge before committing', async () => {
  let options!: Parameters<typeof receiveTransfer>[0];
  vi.mocked(receiveTransfer).mockImplementation(async value => { options = value; await new Promise(() => {}); });
  const { result } = store();
  const imported = vi.fn();
  render(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Transfer between devices' }));
  fireEvent.click(screen.getByRole('button', { name: 'Receive library' }));
  await act(async () => { options.onInvitation('tc-synthetic'); });
  let paired = false;
  await act(async () => { void options.onPaired('123456').then(() => { paired = true; }); });
  expect(paired).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Codes match' }));
  await act(async () => {});
  expect(paired).toBe(true);
  const incoming = newWorkspace();
  incoming.templates.push({ id: 'synthetic', title: 'Synthetic incoming', description: '', body: 'Exact 🐱\ntext' });
  incoming.preferredApp = 'Claude';
  let committed = false;
  await act(async () => { void options.onBackup(exportBackup(incoming)).then(() => { committed = true; }); });
  expect(imported).not.toHaveBeenCalled();
  expect(committed).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Apply transfer' }));
  await act(async () => {});
  expect(imported).toHaveBeenCalledOnce();
  expect(committed).toBe(true);
  expect(result.data.templates.find(item => item.id === 'synthetic')?.body).toBe('Exact 🐱\ntext');
  expect(result.data.preferredApp).toBe('T3 Chat');
});

test('cancellation aborts the session and ignores a late incoming backup', async () => {
  let options!: Parameters<typeof receiveTransfer>[0];
  vi.mocked(receiveTransfer).mockImplementation(async value => { options = value; await new Promise(() => {}); });
  const { result } = store();
  const imported = vi.fn();
  render(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Transfer between devices' }));
  fireEvent.click(screen.getByRole('button', { name: 'Receive library' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel transfer' }));
  expect(options.signal.aborted).toBe(true);
  await expect(options.onBackup(exportBackup(newWorkspace()))).rejects.toMatchObject({ name: 'AbortError' });
  expect(imported).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Transfer between devices' }));
  expect(screen.queryByRole('button', { name: 'Apply transfer' })).toBeNull();
});

test('storage failure keeps review available and does not acknowledge an import', async () => {
  let options!: Parameters<typeof receiveTransfer>[0];
  vi.mocked(receiveTransfer).mockImplementation(async value => { options = value; await new Promise(() => {}); });
  const { result, storage } = store();
  const imported = vi.fn();
  render(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Transfer between devices' }));
  fireEvent.click(screen.getByRole('button', { name: 'Receive library' }));
  let committed = false;
  await act(async () => { void options.onBackup(exportBackup(newWorkspace())).then(() => { committed = true; }, () => {}); });
  const write = vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('Synthetic quota failure'); });
  fireEvent.click(screen.getByRole('button', { name: 'Apply transfer' }));
  expect(imported).not.toHaveBeenCalled();
  expect(committed).toBe(false);
  expect(screen.getByRole('alert').textContent).toContain('Import failed');
  write.mockRestore();
  fireEvent.click(screen.getByRole('button', { name: 'Apply transfer' }));
  await act(async () => {});
  expect(imported).toHaveBeenCalledOnce();
  expect(committed).toBe(true);
});

test('a changed workspace invalidates the reviewed transfer', async () => {
  let options!: Parameters<typeof receiveTransfer>[0];
  vi.mocked(receiveTransfer).mockImplementation(async value => { options = value; await new Promise(() => {}); });
  const { result } = store();
  const imported = vi.fn();
  const view = render(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  fireEvent.click(screen.getByRole('button', { name: 'Transfer between devices' }));
  fireEvent.click(screen.getByRole('button', { name: 'Receive library' }));
  await act(async () => { void options.onBackup(exportBackup(newWorkspace())).catch(() => {}); });
  result.save({ ...result.data, preferredApp: 'Claude' });
  view.rerender(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  expect(screen.getByRole('button', { name: 'Apply transfer' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(/Your workspace changed during review/)).toBeTruthy();
  expect(imported).not.toHaveBeenCalled();
});


test('invitation opens without network and sending exports only saved data after pairing approval', async () => {
  window.history.replaceState(null, '', '/#transfer=tcSynthetic');
  const { result } = store();
  result.data.templates.push({ id: 'synthetic-send', title: 'Synthetic saved', description: '', body: 'Saved exact 🐱\ntext' });
  Object.assign(result.data, { currentInput: 'Synthetic private pasted value' });
  let approved = false;
  vi.mocked(sendTransfer).mockImplementation(async (_address, _raw, options) => {
    await options.onPaired('ABCDEF12');
    approved = true;
  });
  const imported = vi.fn();
  render(<DeviceTransfer workspace={result.data} store={result} onImported={imported} />);
  expect(screen.getByLabelText('Receiver invitation link or address').getAttribute('value')).toBe('tcSynthetic');
  expect(window.location.hash).toBe('');
  expect(sendTransfer).not.toHaveBeenCalled();
  expect(receiveTransfer).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Send saved library' }));
  await screen.findByRole('button', { name: 'Codes match' });
  expect(sendTransfer).toHaveBeenCalledOnce();
  const [destination, raw] = vi.mocked(sendTransfer).mock.calls[0];
  expect(destination).toBe('tcSynthetic');
  const payload = JSON.parse(raw);
  expect(payload.workspace.templates.find((item: { id: string }) => item.id === 'synthetic-send').body).toBe('Saved exact 🐱\ntext');
  expect(raw).not.toContain('Synthetic private pasted value');
  expect(approved).toBe(false);
  expect(imported).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Codes match' }));
  await screen.findByText('Transfer complete. The other device confirmed its import.');
  expect(approved).toBe(true);
});
