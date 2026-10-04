import { renderPrompt, type PromptTemplate } from './prompt';
import { starterTemplates } from './templates';
import { chatApps, type AppName } from './chat-apps';

export const WORKSPACE_KEY = 'promptroom.workspace';
export type Preset = { id: string; templateId: string; name: string; values: Record<string, string>; app?: AppName };
export type Workspace = {
  version: 1; templates: PromptTemplate[]; favorites: string[]; presets: Preset[];
  preferredApp: AppName; lastUsedPrompt: string;
};
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;
export const recoveryMessage = 'Saved data could not be read safely. The original is untouched and saving is paused. Copy the promptroom.workspace value from browser storage before repairing it, or reopen with a compatible app version. This tab still works for the session.';
const savingMessage = 'Saving failed. Changes are available in this tab only. Allow browser storage or free space, then retry saving before closing this tab.';
export const isPastedInput = (name: string) => /text|transcript/i.test(name);

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
        (item.reusableVariables !== undefined && !strings(item.reusableVariables))) throw new Error('Invalid template');
    const variables = renderPrompt(item.body, {}).variables;
    const reusableVariables = item.reusableVariables as string[] | undefined;
    if (reusableVariables?.some(name => !variables.includes(name) || isPastedInput(name))) throw new Error('Invalid reusable variable');
    return { id: item.id, title: item.title, description: item.description, body: item.body, reusableVariables: reusableVariables ?? [] };
  });
  const ids = templates.map(item => item.id);
  if (new Set(ids).size !== ids.length || value.favorites.some(id => !ids.includes(id))) throw new Error('Invalid template references');
  const presets: Preset[] = value.presets.map(item => {
    if (!record(item) || typeof item.id !== 'string' || !item.id || typeof item.templateId !== 'string' ||
        typeof item.name !== 'string' || !item.name.trim() || !record(item.values) ||
        (item.app !== undefined && !validApp(item.app))) throw new Error('Invalid preset');
    const template = templates.find(template => template.id === item.templateId);
    if (!template || Object.entries(item.values).some(([name, value]) => !template.reusableVariables?.includes(name) || typeof value !== 'string')) throw new Error('Invalid preset defaults');
    return { id: item.id, templateId: item.templateId, name: item.name, values: Object.fromEntries(Object.entries(item.values)) as Record<string, string>, ...(item.app ? { app: item.app } : {}) };
  });
  if (new Set(presets.map(item => item.id)).size !== presets.length) throw new Error('Duplicate preset');
  // A removed last-used prompt is a recoverable stale reference, not corrupt data.
  const lastUsedPrompt = ids.includes(value.lastUsedPrompt) ? value.lastUsedPrompt : 'grammar';
  if (lastUsedPrompt === 'grammar' && !ids.includes('grammar')) templates.push(structuredClone(starterTemplates[0]));
  return { version: 1, templates, favorites: [...value.favorites], presets, preferredApp: value.preferredApp, lastUsedPrompt };
}

export function savePreset(workspace: Workspace, preset: Preset): Workspace {
  const template = workspace.templates.find(item => item.id === preset.templateId);
  if (!template) throw new Error('Prompt no longer exists');
  // Only explicitly reusable defaults enter storage. Never read the pasted input form.
  const values = Object.fromEntries(Object.entries(preset.values).filter(([name]) => template.reusableVariables?.includes(name) && !isPastedInput(name)));
  const next = { ...preset, name: preset.name.trim(), values };
  return readWorkspace({ ...workspace, presets: [...workspace.presets.filter(item => item.id !== preset.id), next] });
}

export function applyPreset(template: PromptTemplate, preset: Preset, inputs: Record<string, string>) {
  if (preset.templateId !== template.id) throw new Error('Preset belongs to another prompt');
  const values = Object.fromEntries([...Object.entries(inputs), ...(template.reusableVariables ?? []).map(name => [name, Object.hasOwn(preset.values, name) ? preset.values[name] : ''])]);
  return { values, app: preset.app };
}

export function updateTemplate(workspace: Workspace, template: PromptTemplate): Workspace {
  const variables = renderPrompt(template.body, {}).variables;
  const reusableVariables = (template.reusableVariables ?? []).filter(name => variables.includes(name) && !isPastedInput(name));
  const next = { ...template, reusableVariables };
  return readWorkspace({ ...workspace, lastUsedPrompt: template.id,
    templates: workspace.templates.some(item => item.id === template.id) ? workspace.templates.map(item => item.id === template.id ? next : item) : [...workspace.templates, next],
    presets: workspace.presets.map(preset => preset.templateId === template.id ? { ...preset, values: Object.fromEntries(Object.entries(preset.values).filter(([name]) => reusableVariables.includes(name))) } : preset),
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
