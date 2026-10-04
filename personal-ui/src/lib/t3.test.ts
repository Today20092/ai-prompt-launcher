import { expect, test } from 'vitest';
import { t3Handoff, readT3Options } from './t3';
import { newWorkspace, WorkspaceStore } from './workspace';

test('T3 receives the complete Unicode prompt and all six URL options', () => {
  const prompt = 'Line one & two?\n你好 + café # {{literal}}';
  const handoff = t3Handoff(prompt, { model: 'claude-4.6-sonnet', effort: 'high', search: true, search_limit: 3, profile: 'Work profile', temporary: true });
  expect(handoff.direct).toBe(true);
  const url = new URL(handoff.url);
  expect(url.origin + url.pathname).toBe('https://t3.chat/new');
  expect(Object.fromEntries(url.searchParams)).toEqual({ q: prompt, model: 'claude-4.6-sonnet', effort: 'high', search: 'true', search_limit: '3', profile: 'Work profile', temporary: 'true' });
});

test('default options are omitted, explicit false is preserved, and search limits are omitted when search is off', () => {
  expect(Object.fromEntries(new URL(t3Handoff('Hello').url).searchParams)).toEqual({ q: 'Hello' });
  expect(Object.fromEntries(new URL(t3Handoff('Hello', { model: ' ', search: false, search_limit: 5, temporary: false }).url).searchParams)).toEqual({ q: 'Hello', search: 'false', temporary: 'false' });
});

test('long prompts use fallback without truncating or changing the rendered text', () => {
  const prompt = 'Synthetic transcript\n'.repeat(500);
  const handoff = t3Handoff(prompt);
  expect(handoff.direct).toBe(false);
  expect(new URL(handoff.url).searchParams.get('q')).toBe(prompt);
});

test('invalid option types and search limits are rejected', () => {
  for (const options of [{ search: 'false' }, { temporary: 1 }, { model: 3 }, { search_limit: 0 }, { search_limit: 6 }, { search_limit: 1.5 }, null]) expect(() => readT3Options(options)).toThrow();
});

test('options restore separately for each prompt', () => {
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } };
  const store = new WorkspaceStore(() => storage);
  const data = store.load();
  data.templates[0].t3Options = { model: 'model-a', temporary: true };
  data.templates[1].t3Options = { profile: 'Work', search: false };
  expect(store.save(data)).toBe(true);
  const restored = new WorkspaceStore(() => storage).load();
  expect(restored.templates[0].t3Options).toEqual({ model: 'model-a', temporary: true });
  expect(restored.templates[1].t3Options).toEqual({ profile: 'Work', search: false });
});

test('invalid stored T3 options preserve the original saved document', () => {
  const data = newWorkspace();
  let raw = JSON.stringify({ ...data, templates: [{ ...data.templates[0], t3Options: { search_limit: 99 } }] });
  const original = raw;
  const store = new WorkspaceStore(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }));
  store.load();
  expect(store.message).toContain('original is untouched');
  expect(store.save(newWorkspace())).toBe(false);
  expect(raw).toBe(original);
});
