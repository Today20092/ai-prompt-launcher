import { loadTailcat, type TailcatConnection, type TailcatListener } from './tailcat';
export const TRANSFER_LIMIT = 4 * 1024 * 1024;
const derpMapURL = 'https://tailcat.dev/derpmap.json';
type Options = { signal: AbortSignal; onPaired: (code: string) => Promise<void>; onStatus: (status: string) => void };
type ReceiveOptions = Options & { onInvitation: (address: string) => void; onBackup: (raw: string) => Promise<void> };
function session(options: Options) {
  const controller = new AbortController(), signal = controller.signal;
  let connection: TailcatConnection | undefined, listener: TailcatListener | undefined;
  let disposed = false;
  const close = () => { connection?.close(); listener?.close(); };
  const abort = () => controller.abort(new Error('Transfer cancelled. No automatic retry was made.'));
  options.signal.addEventListener('abort', abort, { once: true });
  signal.addEventListener('abort', close, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Transfer expired. Start a new invitation.')), 300_000);
  if (options.signal.aborted) abort();
  function wait<T>(pending: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const stopped = () => reject(signal.reason);
      if (signal.aborted) { pending.catch(() => {}); reject(signal.reason); return; }
      signal.addEventListener('abort', stopped, { once: true });
      pending.then(resolve, reject).finally(() => signal.removeEventListener('abort', stopped));
    });
  }
  return { signal, wait,
    connection(value: TailcatConnection) { if (signal.aborted || disposed) value.close(); else connection = value; },
    listener(value: TailcatListener) { if (signal.aborted || disposed) value.close(); else listener = value; },
    dispose() { disposed = true; clearTimeout(timer); options.signal.removeEventListener('abort', abort); close(); },
  };
}
// TCP reads need not match writes; cap frames before allocating their buffers.
function frames(connection: TailcatConnection, wait: <T>(pending: Promise<T>) => Promise<T>) {
  let remaining = new Uint8Array(0);
  async function readBytes(length: number) {
    const output = new Uint8Array(length); let offset = 0;
    while (offset < length) {
      if (!remaining.length) {
        const chunk = await wait(connection.read());
        if (!chunk) throw new Error('Connection ended before confirmation. Check the receiving device before retrying.');
        if (chunk.length > 65536) throw new Error('Invalid transfer chunk.');
        remaining = new Uint8Array(chunk);
      }
      const size = Math.min(remaining.length, length - offset);
      output.set(remaining.subarray(0, size), offset);
      remaining = remaining.subarray(size); offset += size;
    }
    return output;
  }
  return {
    async read(): Promise<unknown> {
      const header = await readBytes(4), length = new DataView(header.buffer).getUint32(0);
      if (!length || length > TRANSFER_LIMIT + 1024) throw new Error('Transfer is too large or invalid. Use a JSON backup.');
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readBytes(length)));
    },
    async write(value: unknown) {
      const bytes = new TextEncoder().encode(JSON.stringify(value));
      if (bytes.length > TRANSFER_LIMIT + 1024) throw new Error('Transfer is too large. Use a JSON backup.');
      const header = new Uint8Array(4); new DataView(header.buffer).setUint32(0, bytes.length);
      await wait(connection.write(header));
      for (let offset = 0; offset < bytes.length; offset += 65536) await wait(connection.write(bytes.subarray(offset, offset + 65536)));
    },
  };
}
function message(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid transfer message.');
  return value as Record<string, unknown>;
}
function expectType(value: unknown, type: string) {
  if (message(value).type !== type) throw new Error('Unexpected transfer message.');
}
export async function sendTransfer(address: string, raw: string, options: Options): Promise<void> {
  if (!/^tc[A-Za-z0-9_-]+$/.test(address) || address.length > 2048) throw new Error('Enter a valid tailcat address or invitation link.');
  if (new TextEncoder().encode(raw).length > TRANSFER_LIMIT || new TextEncoder().encode(JSON.stringify({ type: 'backup', raw })).length > TRANSFER_LIMIT + 1024) throw new Error('Library is too large for device transfer. Use a JSON backup.');
  const active = session(options);
  try {
    options.onStatus('Loading encrypted transfer…');
    const runtime = await active.wait(loadTailcat());
    const dialing = runtime.tailcatDial({ addr: address, derpMapURL });
    dialing.then(connection => active.connection(connection), () => {});
    const connection = await active.wait(dialing), stream = frames(connection, active.wait);
    const hello = message(await stream.read());
    if (hello.type !== 'hello' || hello.version !== 1 || typeof hello.code !== 'string' || !/^[0-9A-F]{8}$/.test(hello.code)) throw new Error('Unsupported transfer invitation.');
    await active.wait(options.onPaired(hello.code));
    await stream.write({ type: 'ready' });
    options.onStatus('Waiting for the receiving device to approve…');
    expectType(await stream.read(), 'accept');
    await stream.write({ type: 'backup', raw });
    options.onStatus('Sent. Waiting for the receiving device to apply the import…');
    expectType(await stream.read(), 'imported');
    options.onStatus('Library imported on the receiving device.');
  } finally { active.dispose(); }
}
export async function receiveTransfer(options: ReceiveOptions): Promise<void> {
  const active = session(options);
  try {
    options.onStatus('Loading encrypted transfer…');
    const runtime = await active.wait(loadTailcat());
    let admit!: (connection: TailcatConnection) => void; let admitted = false;
    const incoming = new Promise<TailcatConnection>(resolve => { admit = resolve; });
    const listening = runtime.tailcatListen({ derpMapURL, onConnection(connection) {
      if (admitted || active.signal.aborted) { connection.close(); return; }
      admitted = true; active.connection(connection); admit(connection);
    } });
    listening.then(listener => active.listener(listener), () => {});
    const listener = await active.wait(listening);
    options.onInvitation(listener.addr);
    options.onStatus('Invitation expires in five minutes. Keep both devices open.');
    const connection = await active.wait(incoming), stream = frames(connection, active.wait);
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    await stream.write({ type: 'hello', version: 1, code });
    await active.wait(options.onPaired(code));
    expectType(await stream.read(), 'ready');
    await stream.write({ type: 'accept' });
    const backup = message(await stream.read());
    if (backup.type !== 'backup' || typeof backup.raw !== 'string' || new TextEncoder().encode(backup.raw).length > TRANSFER_LIMIT) throw new Error('Invalid or oversized backup. Nothing was imported.');
    await active.wait(options.onBackup(backup.raw));
    await stream.write({ type: 'imported' });
    options.onStatus('Library imported. Devices disconnected.');
  } finally { active.dispose(); }
}
