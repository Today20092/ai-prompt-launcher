import { renderPrompt, type PromptTemplate } from './prompt';
import { readWorkspace, type Workspace } from './workspace';

export const SHARE_URL_LIMIT = 8000;
export const SHARE_FILE_LIMIT = 256 * 1024;
export const shareRecovery = 'This shared prompt is invalid, unsupported or too large. Your saved workspace is unchanged. Ask the sender for a template or a single-prompt JSON file.';
export type ShareSnapshot = { format: 'promptroom-share'; version: 1; template: Pick<PromptTemplate, 'title' | 'description' | 'body'>; values?: Record<string, string> };

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readSnapshot(raw: string): ShareSnapshot {
  if (new TextEncoder().encode(raw).length > SHARE_FILE_LIMIT) throw new Error(shareRecovery);
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.format !== 'promptroom-share' || value.version !== 1 || !record(value.template)) throw new Error(shareRecovery);
  const { title, description, body } = value.template;
  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || typeof body !== 'string' || !body.trim()) throw new Error(shareRecovery);
  const snapshot: ShareSnapshot = { format: 'promptroom-share', version: 1, template: { title, description, body } };
  if (value.values !== undefined) {
    if (!record(value.values)) throw new Error(shareRecovery);
    const variables = renderPrompt(body, {}).variables;
    if (Object.entries(value.values).some(([key, item]) => !variables.includes(key) || typeof item !== 'string')) throw new Error(shareRecovery);
    snapshot.values = Object.fromEntries(Object.entries(value.values)) as Record<string, string>;
  }
  return snapshot;
}

export function createSnapshot(template: PromptTemplate, values: Readonly<Record<string, string>>, selected: string[] = []): ShareSnapshot {
  const snapshot: ShareSnapshot = { format: 'promptroom-share', version: 1, template: { title: template.title, description: template.description, body: template.body } };
  const variables = renderPrompt(template.body, {}).variables;
  const included = Object.fromEntries(selected.filter(name => variables.includes(name) && Object.hasOwn(values, name)).map(name => [name, values[name]]));
  if (Object.keys(included).length) snapshot.values = included;
  return snapshot;
}

export function shareLink(snapshot: ShareSnapshot, base: string): string | null {
  const url = new URL(base);
  url.search = '';
  url.hash = `share=${encodeURIComponent(JSON.stringify(snapshot))}`;
  return url.href.length <= SHARE_URL_LIMIT ? url.href : null;
}

export function readShareLink(link: string): ShareSnapshot | null {
  const url = new URL(link);
  const hash = url.hash.slice(1);
  if (!hash.startsWith('share=')) return null;
  if (url.href.length > SHARE_URL_LIMIT) throw new Error(shareRecovery);
  return readSnapshot(decodeURIComponent(hash.slice(6)));
}

export function exportPrompt(template: PromptTemplate): string {
  const raw = JSON.stringify(createSnapshot(template, {}), null, 2);
  readSnapshot(raw);
  return raw;
}

// Saving creates a new identity and includes only the reusable definition.
export function saveReceivedCopy(workspace: Workspace, template: PromptTemplate): { next: Workspace; copy: PromptTemplate } {
  const definition = readSnapshot(exportPrompt(template)).template;
  let id: string;
  do { id = crypto.randomUUID(); } while (workspace.templates.some(item => item.id === id));
  const copy = { ...definition, id };
  return { next: readWorkspace({ ...workspace, templates: [...workspace.templates, copy] }), copy };
}
