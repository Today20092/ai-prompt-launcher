import { readWorkspace, type Workspace } from './workspace';
import type { PromptTemplate } from './prompt';
import { decodeContract, parseJson } from './validation';
import { BackupSchema } from './contracts';

export function exportBackup(workspace: Workspace): string {
  // The saved-data reader selects only persistent fields, never current inputs.
  return JSON.stringify({ format: 'promptroom-backup', version: 1, workspace: readWorkspace(workspace) }, null, 2);
}

export function readBackup(raw: string): Workspace {
  const value = decodeContract(BackupSchema, parseJson(raw), true);
  return readWorkspace(value.workspace, false);
}

function contentKey({ id: _id, ...content }: { id: string }): string {
  return JSON.stringify(content, (_key, value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
    }
    return value;
  });
}

function availableId(id: string, used: Set<string>): string {
  while (used.has(id)) id = crypto.randomUUID();
  used.add(id);
  return id;
}

export type ImportPlan = {
  next: Workspace; added: PromptTemplate[]; skipped: number;
  archivedAdded: number; archivedSkipped: number; favoritesAdded: number;
  restorePreferences: boolean;
};

export function planImport(current: Workspace, incoming: Workspace, restorePreferences = false): ImportPlan {
  const next = readWorkspace(current);
  const source = readWorkspace(incoming, false);
  const templateIds = new Set(next.templates.map(item => item.id));
  const templateKeys = new Map(next.templates.map(item => [contentKey(item), item.id]));
  const remapped = new Map<string, string>();
  const added: PromptTemplate[] = [];
  let skipped = 0;
  for (const item of source.templates) {
    const key = contentKey(item);
    const duplicateId = templateKeys.get(key);
    if (duplicateId !== undefined) {
      remapped.set(item.id, duplicateId);
      skipped++;
      continue;
    }
    const template = { ...item, id: availableId(item.id, templateIds) };
    remapped.set(item.id, template.id);
    templateKeys.set(key, template.id);
    next.templates.push(template);
    added.push(template);
  }
  const presetIds = new Set(next.presets.map(item => item.id));
  const presetKeys = new Set(next.presets.map(contentKey));
  let archivedAdded = 0;
  let archivedSkipped = 0;
  for (const item of source.presets) {
    const preset = { ...item, templateId: remapped.get(item.templateId)! };
    const key = contentKey(preset);
    if (presetKeys.has(key)) { archivedSkipped++; continue; }
    next.presets.push({ ...preset, id: availableId(preset.id, presetIds) });
    presetKeys.add(key);
    archivedAdded++;
  }
  const favorites = new Set(next.favorites);
  for (const id of source.favorites) favorites.add(remapped.get(id)!);
  const favoritesAdded = favorites.size - next.favorites.length;
  next.favorites = [...favorites];
  if (restorePreferences) {
    next.preferredApp = source.preferredApp;
    next.lastUsedPrompt = remapped.get(source.lastUsedPrompt)!;
  }
  return { next, added, skipped, archivedAdded, archivedSkipped, favoritesAdded, restorePreferences };
}

// Disambiguate names in the interface without altering backup content or deduplication.
export function templateLabel(template: PromptTemplate, templates: PromptTemplate[]): string {
  const sameName = templates.filter(item => item.title === template.title);
  return sameName.length > 1 ? `${template.title} (${sameName.findIndex(item => item.id === template.id) + 1})` : template.title;
}
