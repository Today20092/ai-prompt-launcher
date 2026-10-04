import type { PromptTemplate } from './prompt';
import { starterTemplates } from './templates';
import { chatApps, type AppName } from './chat-apps';
import { readT3Options } from './t3';

export const WORKSPACE_KEY = 'promptroom.workspace';
// Retained only to preserve previously saved data. Presets are no longer a feature.
type Preset = { id: string; templateId: string; name: string; values: Record<string, string>; app?: AppName };
export type Workspace = {
  version: 1; templates: PromptTemplate[]; favorites: string[]; presets: Preset[];
  preferredApp: AppName; lastUsedPrompt: string;
};
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;
export const recoveryMessage = 'Saved data could not be read safely. The original is untouched and saving is paused. Copy the promptroom.workspace value from browser storage before repairing it, or reopen with a compatible app version. This tab still works for the session.';
const savingMessage = 'Saving failed. Changes are available in this tab only. Allow browser storage or free space, then retry saving before closing this tab.';

export function newWorkspace(): Workspace {
  return { version: 1, templates: structuredClone(starterTemplates), favorites: [], presets: [], preferredApp: 'T3 Chat', lastUsedPrompt: 'grammar' };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string') && new Set(value).size === value.length;
}
function validApp(value: unknown): value is AppName {
  return chatApps.some(app => app.name === value);
}

// Validate the whole document before using it. Unknown versions have no migration yet.
export function readWorkspace(value: unknown): Workspace {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.templates) || !value.templates.length ||
      !strings(value.favorites) || !Array.isArray(value.presets) || !validApp(value.preferredApp) || typeof value.lastUsedPrompt !== 'string') throw new Error('Invalid workspace');
  const templates: PromptTemplate[] = value.templates.map(item => {
    if (!record(item) || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !item.title.trim() ||
        typeof item.description !== 'string' || typeof item.body !== 'string' || !item.body.trim() ||
        (item.reusableVariables !== undefined && !strings(item.reusableVariables)) ||
        (item.chatApp !== undefined && !validApp(item.chatApp))) throw new Error('Invalid template');
    const reusableVariables = item.reusableVariables as string[] | undefined;
    return { id: item.id, title: item.title, description: item.description, body: item.body,
      ...(reusableVariables !== undefined ? { reusableVariables } : {}), ...(item.chatApp ? { chatApp: item.chatApp } : {}),
      ...(item.t3Options !== undefined ? { t3Options: readT3Options(item.t3Options) } : {}) };
  });
  const ids = templates.map(item => item.id);
  if (new Set(ids).size !== ids.length || value.favorites.some(id => !ids.includes(id))) throw new Error('Invalid template references');
  const presets: Preset[] = value.presets.map(item => {
    if (!record(item) || typeof item.id !== 'string' || !item.id || typeof item.templateId !== 'string' ||
        typeof item.name !== 'string' || !item.name.trim() || !record(item.values) ||
        (item.app !== undefined && !validApp(item.app))) throw new Error('Invalid preset');
    const template = templates.find(template => template.id === item.templateId);
    if (!template || Object.values(item.values).some(value => typeof value !== 'string')) throw new Error('Invalid archived preset');
    return { id: item.id, templateId: item.templateId, name: item.name, values: Object.fromEntries(Object.entries(item.values)) as Record<string, string>, ...(item.app ? { app: item.app } : {}) };
  });
  if (new Set(presets.map(item => item.id)).size !== presets.length) throw new Error('Duplicate preset');
  // A removed last-used prompt is a recoverable stale reference, not corrupt data.
  const lastUsedPrompt = ids.includes(value.lastUsedPrompt) ? value.lastUsedPrompt : 'grammar';
  if (lastUsedPrompt === 'grammar' && !ids.includes('grammar')) templates.push(structuredClone(starterTemplates[0]));
  return { version: 1, templates, favorites: [...value.favorites], presets, preferredApp: value.preferredApp, lastUsedPrompt };
}

export function updateTemplate(workspace: Workspace, template: PromptTemplate): Workspace {
  return readWorkspace({ ...workspace, lastUsedPrompt: template.id,
    templates: workspace.templates.some(item => item.id === template.id) ? workspace.templates.map(item => item.id === template.id ? { ...item, ...template } : item) : [...workspace.templates, template],
  });
}

export class WorkspaceStore {
  data = newWorkspace();
  message = '';
  private previous: string | null = null;
  private blocked = false;
  private loaded = false;
  constructor(private storage: StorageAccess) {}

  load() {
    try {
      this.previous = this.storage().getItem(WORKSPACE_KEY);
    } catch {
      this.message = savingMessage;
      return this.data;
    }
    try {
      this.data = this.previous === null ? newWorkspace() : readWorkspace(JSON.parse(this.previous));
      this.loaded = true;
      this.message = '';
      if (this.previous === null) this.save(this.data);
    } catch {
      this.blocked = true;
      this.message = recoveryMessage;
    }
    return this.data;
  }

  save(next: Workspace) {
    this.data = readWorkspace(next);
    if (this.blocked) return false;
    try {
      const storage = this.storage();
      if (!this.loaded) {
        // A failed initial read cannot authorize overwriting existing data.
        const existing = storage.getItem(WORKSPACE_KEY);
        if (existing !== null) {
          this.blocked = true;
          this.message = 'Existing saved data is now available. Saving is paused to protect it. Copy any session work, then reload to restore the saved workspace.';
          return false;
        }
        this.loaded = true;
      }
      // Prevent a stale tab from overwriting newer data written in another tab.
      if (storage.getItem(WORKSPACE_KEY) !== this.previous) {
        this.blocked = true;
        this.message = 'Saved data changed in another tab. Saving is paused to protect it. Keep this tab open to copy any unsaved work, then reload to use the latest saved workspace.';
        return false;
      }
      const raw = JSON.stringify(this.data);
      storage.setItem(WORKSPACE_KEY, raw);
      this.previous = raw;
      this.message = '';
      return true;
    } catch {
      this.message = savingMessage;
      return false;
    }
  }
}
