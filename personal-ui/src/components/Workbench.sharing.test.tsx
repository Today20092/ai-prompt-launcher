// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Workbench from './Workbench';
import { createSnapshot, shareLink } from '../lib/sharing';
import { WORKSPACE_KEY } from '../lib/workspace';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', window.location.pathname);
});

function shareHash(title: string) {
  const template = { id: title, title, description: '', body: 'Review {{text}}.' };
  const link = shareLink(createSnapshot(template, {}), window.location.href);
  return new URL(link!).hash;
}

test('reviews same-tab share links and browser history without saving until asked', async () => {
  const data = new Map<string, string>();
  vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    clear: () => { data.clear(); },
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => { data.delete(key); },
    get length() { return data.size; },
  });
  const first = shareHash('First incoming template');
  const second = shareHash('Second incoming template');
  window.history.replaceState(null, '', first);
  render(<Workbench />);
  await screen.findByRole('heading', { name: 'First incoming template' });
  const savedBefore = data.get(WORKSPACE_KEY);
  expect(savedBefore).toBeDefined();
  expect(savedBefore).not.toContain('First incoming template');

  window.location.hash = second;
  await screen.findByRole('heading', { name: 'Second incoming template' });
  expect(data.get(WORKSPACE_KEY)).toBe(savedBefore);

  window.history.back();
  await screen.findByRole('heading', { name: 'First incoming template' });
  window.history.forward();
  await screen.findByRole('heading', { name: 'Second incoming template' });

  window.location.hash = '#workspace';
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(screen.getByRole('heading', { name: 'Second incoming template' })).toBeTruthy();
  expect(data.get(WORKSPACE_KEY)).toBe(savedBefore);

  window.location.hash = '#share=%ZZ';
  await screen.findByText(/This shared prompt is invalid/);
  expect(screen.queryByRole('button', { name: 'Save a copy' })).toBeNull();
  expect(data.get(WORKSPACE_KEY)).toBe(savedBefore);

  window.location.hash = second;
  await screen.findByRole('heading', { name: 'Second incoming template' });
  fireEvent.click(screen.getByRole('button', { name: 'Save a copy' }));
  expect(data.get(WORKSPACE_KEY)).toContain('Second incoming template');
  expect(data.get(WORKSPACE_KEY)).not.toContain('First incoming template');
});
