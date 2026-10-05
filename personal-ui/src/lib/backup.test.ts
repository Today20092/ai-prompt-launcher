import { expect, test } from 'vitest';
import { exportBackup, planImport, readBackup, templateLabel } from './backup';
import { newWorkspace } from './workspace';

test('a backup round trip preserves tools, favorites, archived presets and app options without session input', () => {
  const workspace = newWorkspace();
  workspace.preferredApp = 'Claude';
  workspace.templates[0].chatApp = 'ChatGPT';
  workspace.templates[0].t3Options = { search: false, profile: 'Writing' };
  workspace.favorites = ['grammar'];
  workspace.presets = [{ id: 'old-preset', templateId: 'grammar', name: 'Archived', values: { language: 'English' } }];
  const session = { ...workspace, inputs: { text: 'PRIVATE PASTED TRANSCRIPT' } };
  const raw = exportBackup(session);
  expect(readBackup(raw)).toEqual(workspace);
  expect(raw).not.toContain('PRIVATE PASTED TRANSCRIPT');
  expect(JSON.parse(raw)).toMatchObject({ format: 'promptroom-backup', version: 1 });
});

test('same names remain distinct and duplicate matching ignores object key order and IDs', () => {
  const current = newWorkspace();
  current.templates[0].t3Options = { model: 'model-a', search: false };
  current.presets = [{ id: 'old', templateId: 'grammar', name: 'Language', values: { first: 'a', second: 'b' } }];
  const incoming = newWorkspace();
  incoming.templates[0].id = '__proto__';
  incoming.templates[0].t3Options = { search: false, model: 'model-a' };
  incoming.lastUsedPrompt = '__proto__';
  incoming.favorites = ['__proto__'];
  incoming.presets = [{ id: 'different', templateId: '__proto__', name: 'Language', values: { second: 'b', first: 'a' } }];
  incoming.templates.push({ id: 'other', title: current.templates[0].title, description: '', body: 'Different {{text}}' });
  const plan = planImport(current, incoming);
  expect(plan.skipped).toBe(2);
  expect(plan.archivedSkipped).toBe(1);
  expect(plan.next.presets).toEqual(current.presets);
  expect(plan.next.favorites).toEqual(['grammar']);
  expect(plan.added.map(item => item.body)).toEqual(['Different {{text}}']);
  expect(templateLabel(plan.next.templates[0], plan.next.templates)).toBe('Grammar corrector (1)');
  expect(templateLabel(plan.added[0], plan.next.templates)).toBe('Grammar corrector (2)');
  expect(plan.next.templates[0].title).toBe('Grammar corrector');
});

test('invalid or unsupported backups are rejected instead of repaired or partially merged', () => {
  const valid = JSON.parse(exportBackup(newWorkspace()));
  const invalid = [
    '{broken',
    JSON.stringify({ ...valid, version: 99 }),
    JSON.stringify({ ...valid, format: 'another-app' }),
    JSON.stringify({ ...valid, workspace: { ...valid.workspace, version: 2 } }),
    JSON.stringify({ ...valid, workspace: { ...valid.workspace, lastUsedPrompt: 'missing' } }),
    JSON.stringify({ ...valid, workspace: { ...valid.workspace, favorites: ['missing'] } }),
    JSON.stringify({ ...valid, workspace: { ...valid.workspace, templates: [valid.workspace.templates[0], { ...valid.workspace.templates[1], t3Options: { search_limit: 9 } }] } }),
    JSON.stringify({ ...valid, workspace: { ...valid.workspace, presets: [{ id: 'p', templateId: 'missing', name: 'Old', values: {} }] } }),
  ];
  for (const raw of invalid) expect(() => readBackup(raw)).toThrow();
});

test('merging remaps conflicting IDs and references, preserves preferences and skips repeat imports', () => {
  const current = newWorkspace();
  current.preferredApp = 'ChatGPT';
  current.presets = [{ id: 'p', templateId: 'grammar', name: 'Existing', values: { language: 'French' } }];
  const incoming = newWorkspace();
  incoming.templates[0].body = 'Translate this: {{text}}';
  incoming.templates[0].chatApp = 'Claude';
  incoming.templates[0].t3Options = { search: false };
  incoming.favorites = ['grammar'];
  incoming.preferredApp = 'Claude';
  incoming.presets = [{ id: 'p', templateId: 'grammar', name: 'Imported', values: { language: 'English' } }];
  const plan = planImport(current, incoming);
  expect(plan.added.map(item => item.body)).toEqual(['Translate this: {{text}}']);
  expect(plan.skipped).toBe(1);
  expect(plan.next.templates.slice(0, 2)).toEqual(current.templates);
  const added = plan.added[0];
  expect(added.id).not.toBe('grammar');
  expect(added.chatApp).toBe('Claude');
  expect(added.t3Options).toEqual({ search: false });
  expect(plan.next.favorites).toEqual([added.id]);
  expect(plan.next.presets[1]).toMatchObject({ templateId: added.id, name: 'Imported' });
  expect(plan.next.presets[1].id).not.toBe('p');
  expect(plan.next.preferredApp).toBe('ChatGPT');
  expect(plan.next.lastUsedPrompt).toBe('grammar');
  const repeat = planImport(plan.next, incoming);
  expect(repeat.added).toEqual([]);
  expect(repeat.skipped).toBe(2);
  expect(repeat.next).toEqual(plan.next);
});
