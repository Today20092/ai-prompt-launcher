import { expect, test, vi } from 'vitest';
import { sendTransfer, receiveTransfer, TRANSFER_LIMIT } from './device-transfer';
import type { TailcatConnection, TailcatRuntime } from './tailcat';
vi.mock('./tailcat', () => ({ loadTailcat: () => Promise.resolve(runtime) }));
let runtime: TailcatRuntime;
function pair() {
  function channel() {
    const queue: (Uint8Array | null)[] = [];
    let wake: ((value: Uint8Array | null) => void) | undefined;
    return { put(value: Uint8Array | null) { if (wake) { const next = wake; wake = undefined; next(value); } else queue.push(value); }, read() { if (queue.length) return Promise.resolve(queue.shift()!); return new Promise<Uint8Array | null>(resolve => { wake = resolve; }); } };
  }
  const a = channel(), b = channel();
  const closed = vi.fn(() => { a.put(null); b.put(null); });
  const sender: TailcatConnection = { read: a.read, write: async bytes => b.put(bytes.slice()), closeWrite: async () => b.put(null), close: closed };
  const receiver: TailcatConnection = { read: b.read, write: async bytes => a.put(bytes.slice()), closeWrite: async () => a.put(null), close: closed };
  let connect!: (connection: TailcatConnection) => void;
  const closeListener = vi.fn();
  runtime = { tailcatListen: async options => { connect = options.onConnection; return { addr: 'tc-synthetic', close: closeListener }; }, tailcatDial: async () => { connect(receiver); return sender; } };
  return { closeListener, closed };
}
test('transfer waits for both approvals and reports success only after import acknowledgement', async () => {
  pair();
  const signal = new AbortController().signal;
  let invited!: () => void;
  const invitation = new Promise<void>(resolve => { invited = resolve; });
  let approve!: () => void;
  const approval = new Promise<void>(resolve => { approve = resolve; });
  let commit!: () => void;
  const imported = new Promise<void>(resolve => { commit = resolve; });
  const onBackup = vi.fn(async (raw: string) => { expect(raw).toBe('Synthetic 🐱\nexact'); await imported; });
  const receiver = receiveTransfer({ signal, onInvitation: invited, onPaired: () => approval, onBackup, onStatus: vi.fn() });
  await invitation;
  let done = false;
  const sender = sendTransfer('tc-synthetic', 'Synthetic 🐱\nexact', { signal, onPaired: async () => {}, onStatus: vi.fn() }).then(() => { done = true; });
  await vi.waitFor(() => expect(onBackup).not.toHaveBeenCalled());
  approve();
  await vi.waitFor(() => expect(onBackup).toHaveBeenCalledOnce());
  expect(done).toBe(false);
  commit(); await Promise.all([receiver, sender]); expect(done).toBe(true);
});
test('abort closes an idle invitation and oversized outgoing data never dials', async () => {
  const { closeListener } = pair();
  const controller = new AbortController();
  const pending = receiveTransfer({ signal: controller.signal, onInvitation: () => controller.abort(), onPaired: async () => {}, onBackup: async () => {}, onStatus: vi.fn() });
  await expect(pending).rejects.toThrow(); expect(closeListener).toHaveBeenCalled();
  const dial = vi.spyOn(runtime, 'tailcatDial');
  await expect(sendTransfer('tc-synthetic', 'x'.repeat(TRANSFER_LIMIT + 1), { signal: new AbortController().signal, onPaired: async () => {}, onStatus: vi.fn() })).rejects.toThrow(/large/i);
  expect(dial).not.toHaveBeenCalled();
});

test('rejects oversized incoming frames before reading their body', async () => {
  const header = new Uint8Array(4); new DataView(header.buffer).setUint32(0, 0xffffffff);
  const read = vi.fn(async () => header);
  const close = vi.fn();
  runtime = { tailcatListen: vi.fn(), tailcatDial: async () => ({ read, write: vi.fn(async () => {}), closeWrite: vi.fn(async () => {}), close }) };
  await expect(sendTransfer('tc-synthetic', 'Synthetic', { signal: new AbortController().signal, onPaired: vi.fn(), onStatus: vi.fn() })).rejects.toThrow(/large/i);
  expect(read).toHaveBeenCalledOnce(); expect(close).toHaveBeenCalledOnce();
});
test('cancelled dial closes a late connection and never starts pairing', async () => {
  let connect!: (connection: TailcatConnection) => void;
  runtime = { tailcatListen: vi.fn(), tailcatDial: () => new Promise(resolve => { connect = resolve; }) };
  const controller = new AbortController(), onPaired = vi.fn();
  const pending = sendTransfer('tc-synthetic', 'Synthetic', { signal: controller.signal, onPaired, onStatus: vi.fn() });
  await vi.waitFor(() => expect(connect).toBeTypeOf('function'));
  controller.abort(); await expect(pending).rejects.toThrow(/cancelled/i);
  const close = vi.fn(); connect({ read: vi.fn(), write: vi.fn(async () => {}), closeWrite: vi.fn(async () => {}), close });
  await Promise.resolve(); expect(close).toHaveBeenCalledOnce(); expect(onPaired).not.toHaveBeenCalled();
});
test('fragmented byte reads preserve framing and a lost acknowledgement is not success', async () => {
  const hello = new TextEncoder().encode(JSON.stringify({ type: 'hello', version: 1, code: '1234ABCD' }));
  const header = new Uint8Array(4); new DataView(header.buffer).setUint32(0, hello.length);
  const accepted = new TextEncoder().encode(JSON.stringify({ type: 'accept' }));
  const acceptHeader = new Uint8Array(4); new DataView(acceptHeader.buffer).setUint32(0, accepted.length);
  const bytes = [...header, ...hello, ...acceptHeader, ...accepted];
  const close = vi.fn();
  runtime = { tailcatListen: vi.fn(), tailcatDial: async () => ({ read: async () => bytes.length ? new Uint8Array([bytes.shift()!]) : null, write: vi.fn(async () => {}), closeWrite: vi.fn(async () => {}), close }) };
  const onPaired = vi.fn(async () => {}), onStatus = vi.fn();
  await expect(sendTransfer('tc-synthetic', 'Synthetic', { signal: new AbortController().signal, onPaired, onStatus })).rejects.toThrow(/Check the receiving device/);
  expect(onPaired).toHaveBeenCalledWith('1234ABCD');
  expect(onStatus).not.toHaveBeenCalledWith('Library imported on the receiving device.'); expect(close).toHaveBeenCalled();
});
test('escaped payload over the wire limit is rejected before connecting', async () => {
  pair(); const dial = vi.spyOn(runtime, 'tailcatDial');
  await expect(sendTransfer('tc-synthetic', '\\'.repeat(TRANSFER_LIMIT), { signal: new AbortController().signal, onPaired: vi.fn(), onStatus: vi.fn() })).rejects.toThrow(/large/i);
  expect(dial).not.toHaveBeenCalled();
});
