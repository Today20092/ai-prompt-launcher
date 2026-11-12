export type TailcatConnection = {
  read(): Promise<Uint8Array | null>;
  write(bytes: Uint8Array): Promise<void>;
  closeWrite(): Promise<void>;
  close(): void;
};
export type TailcatListener = { addr: string; close(): void };
export type TailcatRuntime = {
  tailcatListen(options: { derpMapURL: string; onConnection: (connection: TailcatConnection) => void }): Promise<TailcatListener>;
  tailcatDial(options: { addr: string; derpMapURL: string }): Promise<TailcatConnection>;
};
type GoRuntime = { importObject: WebAssembly.Imports; run(instance: WebAssembly.Instance): Promise<void> };
type TailcatGlobals = typeof globalThis & Partial<TailcatRuntime> & { Go?: new () => GoRuntime; onTailcatReady?: () => void };
let loading: Promise<TailcatRuntime> | undefined;

// Load the pinned local runtime only after an explicit transfer action.
export function loadTailcat(): Promise<TailcatRuntime> {
  if (loading) return loading;
  loading = new Promise<TailcatRuntime>((resolve, reject) => {
    const globals = globalThis as TailcatGlobals;
    const script = document.createElement('script');
    const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/tailcat/`;
    const timer = setTimeout(() => reject(new Error('Tailcat loading timed out. Reload this page or use a JSON backup.')), 60_000);
    const fail = () => { clearTimeout(timer); reject(new Error('Tailcat could not load. Reload this page or use a JSON backup.')); };
    globals.onTailcatReady = () => {
      clearTimeout(timer);
      if (!globals.tailcatListen || !globals.tailcatDial) return fail();
      resolve({ tailcatListen: globals.tailcatListen, tailcatDial: globals.tailcatDial });
    };
    script.src = `${base}wasm_exec.js`;
    script.onerror = fail;
    script.onload = async () => {
      try {
        if (!globals.Go) throw new Error('Go runtime missing');
        const go = new globals.Go();
        const response = await fetch(`${base}main.wasm.gz`);
        if (!response.ok || !response.body) throw new Error('WASM unavailable');
        // Fetch already decompresses responses marked Content-Encoding: gzip.
        const stream = response.headers.get('Content-Encoding')?.includes('gzip')
          ? response.body : response.body.pipeThrough(new DecompressionStream('gzip'));
        const { instance } = await WebAssembly.instantiateStreaming(new Response(stream, { headers: { 'Content-Type': 'application/wasm' } }), go.importObject);
        void go.run(instance).catch(fail);
      } catch { fail(); }
    };
    document.head.append(script);
  });
  return loading;
}
