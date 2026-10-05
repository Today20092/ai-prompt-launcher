import { describe, expect, it } from 'vitest';
import { createSnapshot, shareLink, readShareLink, readSnapshot, exportPrompt, saveReceivedCopy, SHARE_FILE_LIMIT } from './sharing';
import { newWorkspace, WorkspaceStore, WORKSPACE_KEY } from './workspace';

describe('share snapshots', () => {
  it('excludes current input and unrelated template settings by default', () => {
    const template = { id: 'private-id', title: 'Name', description: 'Description', body: 'Read {{text}}', chatApp: 'T3 Chat' as const };
    const snapshot = createSnapshot(template, { text: 'PRIVATE' });
    expect(snapshot).toEqual({ format: 'promptroom-share', version: 1, template: { title: 'Name', description: 'Description', body: 'Read {{text}}' } });
    const link = shareLink(snapshot, 'https://example.com/ai-prompt-launcher/?old=1');
    expect(link).not.toContain('PRIVATE');
    expect(readShareLink(link!)).toEqual(snapshot);
  });
  it('restores only deliberately selected values exactly and freezes the snapshot', () => {
    const template = { id: 'x', title: ' 名 &?# ', description: '\n<em>plain</em>', body: 'Read {{text}}\n{{other}}' };
    const values = { text: ' \n你好 🐈 &?#%+ {{other}}\r\n', other: 'excluded', unrelated: 'private' };
    const snapshot = createSnapshot(template, values, ['text']);
    template.body = 'changed';
    values.text = 'changed';
    expect(readShareLink(shareLink(snapshot, 'https://example.com/')!)).toEqual({ format: 'promptroom-share', version: 1, template: { title: ' 名 &?# ', description: '\n<em>plain</em>', body: 'Read {{text}}\n{{other}}' }, values: { text: ' \n你好 🐈 &?#%+ {{other}}\r\n' } });
  });
  it('rejects malformed, unsupported, unrelated and excessive inbound payloads', () => {
    for (const raw of ['{', '{}', JSON.stringify({ format: 'promptroom-share', version: 2 }), 'x'.repeat(SHARE_FILE_LIMIT + 1), JSON.stringify({ ...createSnapshot({ id: 'x', title: 'X', description: '', body: '{{text}}' }, {}), values: { unrelated: 'bad' } })]) expect(() => readSnapshot(raw)).toThrow();
    expect(() => readShareLink('https://example.com/#share=%ZZ')).toThrow();
    expect(() => readShareLink('https://example.com/#share=' + 'x'.repeat(8000))).toThrow();
    expect(readShareLink('https://example.com/#p=legacy')).toBeNull();
  });
  it('counts the complete URL and provides an exact template-only file fallback', () => {
    const template = { id: 'x', title: 'X', description: '', body: '你好\n'.repeat(1000) + '{{text}}' };
    const snapshot = createSnapshot(template, { text: 'PRIVATE' });
    expect(shareLink(snapshot, 'https://example.com/ai-prompt-launcher/')).toBeNull();
    expect(readSnapshot(exportPrompt(template))).toEqual(snapshot);
    expect(shareLink(createSnapshot({ ...template, body: 'short' }, {}), 'https://example.com/' + 'a'.repeat(8000))).toBeNull();
    expect(() => exportPrompt({ ...template, body: 'a'.repeat(SHARE_FILE_LIMIT) })).toThrow();
  });
  it('saves an independent copy without overwrites or changing selection and preferences', () => {
    const workspace = newWorkspace();
    const original = structuredClone(workspace);
    const template = { ...workspace.templates[0], values: { text: 'PRIVATE' } };
    const { next, copy } = saveReceivedCopy(workspace, template);
    expect(copy.id).not.toBe(template.id);
    expect(copy).toEqual({ id: copy.id, title: template.title, description: template.description, body: template.body });
    expect(next.templates.slice(0, -1)).toEqual(original.templates);
    expect({ ...next, templates: original.templates }).toEqual(original);
    expect(workspace).toEqual(original);
    expect(saveReceivedCopy(next, template).next.templates).toHaveLength(next.templates.length + 1);
  });
  it('leaves the saved and visible workspace unchanged when explicit saving fails', () => {
    let raw = JSON.stringify(newWorkspace());
    const store = new WorkspaceStore(() => ({ getItem: key => key === WORKSPACE_KEY ? raw : null, setItem: () => { throw new Error('denied'); } }));
    const current = store.load();
    const { next } = saveReceivedCopy(current, current.templates[0]);
    expect(store.importWorkspace(next)).toBe(false);
    expect(store.data).toBe(current);
    expect(raw).toBe(JSON.stringify(current));
  });
});
