import { expect, test } from 'vitest';
import { beginProviderLaunch, beginDeviceShare, beginClipboard, LatestOperation, readFile, downloadText } from './browser';
import { runBoundary, runBoundarySync } from './boundary';

test('fallback opens synchronously before clipboard and preserves the complete prompt', async () => {
  const events: string[] = [];
  const destination = { opener: 'old' as unknown, location: { replace: (url: string) => events.push(url) }, close: () => events.push('close') };
  const effect = beginProviderLaunch({ open: () => { events.push('open'); return destination; }, copy: async text => { events.push(text); } }, ' \nUnicode 🐱 &?#%+\r\n ', 'https://claude.ai/new');
  expect(events).toEqual(['open', ' \nUnicode 🐱 &?#%+\r\n ']);
  expect(destination.opener).toBeNull();
  expect(await runBoundary(effect)).toEqual({ _tag: 'Success', value: undefined });
  expect(events).toEqual(['open', ' \nUnicode 🐱 &?#%+\r\n ', 'https://claude.ai/new']);
});

test('denied clipboard closes the unused window and blocked popup never copies', async () => {
  let closed = false;
  const destination = { opener: null, location: { replace: () => { throw new Error('must not navigate'); } }, close: () => { closed = true; } };
  expect(await runBoundary(beginProviderLaunch({ open: () => destination, copy: () => Promise.reject(new Error('denied')) }, 'synthetic', 'https://claude.ai/new'))).toEqual({ _tag: 'ClipboardFailure' });
  expect(closed).toBe(true);
  expect(await runBoundary(beginProviderLaunch({ open: () => null, copy: () => { throw new Error('must not copy'); } }, 'synthetic', 'https://claude.ai/new'))).toEqual({ _tag: 'NavigationBlocked' });
});

test('native share is invoked within the initiating gesture and cancellation is explicit', async () => {
  let called = false;
  const effect = beginDeviceShare({ share: () => { called = true; return Promise.reject(new DOMException('cancel', 'AbortError')); } }, 'https://example.com/#synthetic');
  expect(called).toBe(true);
  expect(await runBoundary(effect)).toEqual({ _tag: 'Cancelled' });
  expect(await runBoundary(beginDeviceShare({}, 'https://example.com/'))).toEqual({ _tag: 'SharingUnavailable' });
});

test('cancel or superseding work cannot publish a stale completion', async () => {
  const operations = new LatestOperation();
  let complete!: () => void;
  const first = operations.run(beginClipboard({ copy: () => new Promise<void>(resolve => { complete = resolve; }) }, 'old'));
  const second = operations.run(beginClipboard({ copy: async () => {} }, 'new'));
  expect(await first).toEqual({ _tag: 'Cancelled' });
  expect(await second).toEqual({ _tag: 'Success', value: undefined });
  complete();
  const third = operations.run(beginClipboard({ copy: () => new Promise<void>(() => {}) }, 'disposed'));
  operations.cancel();
  expect(await third).toEqual({ _tag: 'Cancelled' });
});

test('single-prompt file size is checked before reading while backup reads have no share budget', async () => {
  let reads = 0;
  const file = { size: 300000, text: async () => { reads++; return 'synthetic'; } };
  expect(await runBoundary(readFile(file, 262144))).toEqual({ _tag: 'OversizedData' });
  expect(reads).toBe(0);
  expect(await runBoundary(readFile(file))).toEqual({ _tag: 'Success', value: 'synthetic' });
  expect(reads).toBe(1);
  expect(await runBoundary(readFile({ size: 1, text: async () => { throw new Error('cannot read'); } }))).toEqual({ _tag: 'InvalidData' });
});

test('failed download cleans up its anchor and object URL exactly once', () => {
  const events: string[] = [];
  const browser = {
    createUrl: () => { events.push('create'); return 'blob:synthetic'; },
    revokeUrl: (url: string) => events.push(url),
    createAnchor: () => ({ href: '', download: '', click: () => { events.push('click'); throw new Error('blocked'); }, remove: () => events.push('remove') }),
    append: () => events.push('append'), defer: (cleanup: () => void) => cleanup(),
  };
  expect(runBoundarySync(downloadText('synthetic', 'synthetic.json', browser))).toEqual({ _tag: 'DownloadFailure' });
  expect(events).toEqual(['create', 'append', 'click', 'remove', 'blob:synthetic']);
});
