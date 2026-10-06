import * as Effect from 'effect/Effect';
import { failure, runBoundary, type BoundaryFailure } from './boundary';

type Clipboard = { copy: (text: string) => Promise<void> };
type Destination = { opener: unknown; location: { replace: (url: string) => void }; close: () => void };
type Navigation = { open: (url: string, features?: string) => Destination | null };
type Sharing = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean };

// Invoke capability NOW, not after an async runner has crossed the user gesture.
function begin<A>(invoke: () => Promise<A>, tag: BoundaryFailure['_tag']) {
  try {
    const pending = invoke();
    return Effect.tryPromise({ try: () => pending, catch: () => failure(tag) });
  } catch { return Effect.fail(failure(tag)); }
}
export const beginClipboard = (browser: Clipboard, text: string) => begin(() => browser.copy(text), 'ClipboardFailure');

export function beginDeviceShare(browser: Sharing, url: string) {
  if (!browser.share) return Effect.fail(failure('SharingUnavailable'));
  const data = { url };
  try {
    if (browser.canShare && !browser.canShare(data)) return Effect.fail(failure('SharingUnavailable'));
    const pending = browser.share(data);
    return Effect.tryPromise({ try: () => pending, catch: error => failure(error instanceof Error && error.name === 'AbortError' ? 'Cancelled' : 'SharingFailure') });
  } catch { return Effect.fail(failure('SharingFailure')); }
}

export function beginProviderLaunch(browser: Clipboard & Navigation, text: string, url: string, direct = false) {
  if (direct) {
    // noopener may return null for a successful open. Keep the UI retry link.
    try { browser.open(url, 'noopener,noreferrer'); return Effect.void; }
    catch { return Effect.fail(failure('NavigationBlocked')); }
  }
  let destination: Destination | null;
  try { destination = browser.open('about:blank'); }
  catch { return Effect.fail(failure('NavigationBlocked')); }
  if (!destination) return Effect.fail(failure('NavigationBlocked'));
  let navigated = false;
  try { destination.opener = null; }
  catch { destination.close(); return Effect.fail(failure('NavigationBlocked')); }
  return beginClipboard(browser, text).pipe(
    Effect.flatMap(() => Effect.try({
      try: () => { destination.location.replace(url); navigated = true; },
      catch: () => failure('NavigationBlocked'),
    })),
    Effect.ensuring(Effect.sync(() => { if (!navigated) destination.close(); })),
  );
}

type DownloadAnchor = { href: string; download: string; click: () => void; remove: () => void };
type DownloadBrowser = {
  createUrl: (text: string) => string; revokeUrl: (url: string) => void;
  createAnchor: () => DownloadAnchor; append: (anchor: DownloadAnchor) => void;
  defer: (cleanup: () => void) => void;
};
const downloadBrowser = (): DownloadBrowser => ({
  createUrl: text => URL.createObjectURL(new Blob([text], { type: 'application/json' })),
  revokeUrl: url => URL.revokeObjectURL(url), createAnchor: () => document.createElement('a'),
  append: anchor => document.body.append(anchor as HTMLAnchorElement),
  defer: cleanup => { window.setTimeout(cleanup, 1000); },
});
export function downloadText(text: string, filename: string, browser: DownloadBrowser = downloadBrowser()) {
  return Effect.try({
    try: () => {
      const url = browser.createUrl(text);
      let anchor: DownloadAnchor | undefined;
      try {
        anchor = browser.createAnchor();
        anchor.href = url; anchor.download = filename;
        browser.append(anchor); anchor.click();
      } finally {
        try { anchor?.remove(); }
        finally { browser.defer(() => browser.revokeUrl(url)); }
      }
    }, catch: () => failure('DownloadFailure'),
  });
}

export function readFile(file: Pick<File, 'text' | 'size'>, limit?: number) {
  if (limit !== undefined && file.size > limit) return Effect.fail(failure('OversizedData'));
  return Effect.tryPromise({ try: () => file.text(), catch: () => failure('InvalidData') });
}

// One active operation per event surface. Cancelling interrupts the runner even
// where the browser cannot cancel an underlying permission dialog / File.text().
export class LatestOperation {
  private controller: AbortController | null = null;
  get active() { return this.controller !== null; }
  cancel() { this.controller?.abort(); this.controller = null; }
  async run<A>(effect: Effect.Effect<A, BoundaryFailure>) {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    try {
      const outcome = await runBoundary(effect, controller.signal);
      return this.controller === controller ? outcome : failure('Cancelled');
    } finally { if (this.controller === controller) this.controller = null; }
  }
}

export const clipboardBrowser = () => ({ copy: (text: string) => navigator.clipboard.writeText(text) });
export const sharingBrowser = (): Sharing => ({
  share: typeof navigator.share === 'function' ? data => navigator.share(data) : undefined,
  canShare: typeof navigator.canShare === 'function' ? data => navigator.canShare(data) : undefined,
});
export const providerBrowser = () => ({ ...clipboardBrowser(), open: (url: string, features?: string) => window.open(url, '_blank', features) });
