import * as Effect from 'effect/Effect';
import type { PromptTemplate } from './prompt';
import { starterTemplates } from './templates';
import { readT3Options } from './t3';
import { decodeContract, DataFailure, parseJson } from './validation';
import { WorkspaceSchema, type Workspace } from './contracts';
import { runBoundarySync, storageOperation, failure, type Outcome } from './boundary';
export type { Workspace } from './contracts';

export const WORKSPACE_KEY = 'promptroom.workspace';
// Retained only to preserve previously saved data. Presets are no longer a feature.
type Preset = Workspace['presets'][number];
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;
export const recoveryMessage = 'Saved data could not be read safely. The original is untouched and saving is paused. Copy the promptroom.workspace value from browser storage before repairing it, or reopen with a compatible app version. This tab still works for the session.';
const savingMessage = 'Saving failed. Changes are available in this tab only. Allow browser storage or free space, then retry saving before closing this tab.';

export function newWorkspace(): Workspace {
  return { version: 1, templates: structuredClone(starterTemplates), favorites: [], presets: [], preferredApp: 'T3 Chat', lastUsedPrompt: 'grammar' };
}

// Validate the whole document before using it. Unknown versions have no migration yet.
export function readWorkspace(input: unknown, recoverSelection = true): Workspace {
  const value = decodeContract(WorkspaceSchema, input, true);
  const unique = (items: readonly string[]) => new Set(items).size === items.length;
  if (!value.templates.length || !unique(value.favorites)) throw new DataFailure();
  const templates = value.templates.map(item => {
    if (!item.id || !item.title.trim() || !item.body.trim() ||
        (item.reusableVariables && !unique(item.reusableVariables))) throw new DataFailure();
    return { id: item.id, title: item.title, description: item.description, body: item.body,
      ...(item.reusableVariables !== undefined ? { reusableVariables: item.reusableVariables } : {}),
      ...(item.chatApp !== undefined ? { chatApp: item.chatApp } : {}),
      ...(item.t3Options !== undefined ? { t3Options: readT3Options(item.t3Options) } : {}) };
  });
  const ids = templates.map(item => item.id);
  if (!unique(ids) || value.favorites.some(id => !ids.includes(id))) throw new DataFailure();
  const presets: Preset[] = value.presets.map(item => {
    if (!item.id || !item.name.trim() || !ids.includes(item.templateId)) throw new DataFailure();
    return { id: item.id, templateId: item.templateId, name: item.name, values: { ...item.values },
      ...(item.app !== undefined ? { app: item.app } : {}) };
  });
  if (!unique(presets.map(item => item.id))) throw new DataFailure();
  if (!recoverSelection && !ids.includes(value.lastUsedPrompt)) throw new DataFailure();
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
  outcome: Outcome<void> = { _tag: 'Success', value: undefined };
  private previous: string | null = null;
  private blocked = false;
  private loaded = false;
  private fresh = false;
  constructor(private storage: StorageAccess) {}

  get canRestorePreferences() { return this.fresh; }

  load() {
    const read = runBoundarySync(storageOperation(() => this.storage().getItem(WORKSPACE_KEY)));
    if (read._tag !== 'Success') {
      this.outcome = read;
      this.message = savingMessage;
      return this.data;
    }
    this.previous = read.value;
    try {
      this.data = this.previous === null ? newWorkspace() : readWorkspace(parseJson(this.previous));
      this.loaded = true;
      this.fresh = this.previous === null;
      this.message = '';
      this.outcome = { _tag: 'Success', value: undefined };
      if (this.previous === null) this.write(this.data);
    } catch (error) {
      if (!(error instanceof DataFailure)) throw error;
      this.blocked = true;
      this.outcome = failure(error._tag);
      this.message = recoveryMessage;
    }
    return this.data;
  }

  save(next: Workspace) {
    this.data = readWorkspace(next);
    this.fresh = false;
    return this.write(this.data);
  }

  // Imports become visible only after the complete document is safely saved.
  importWorkspace(next: Workspace) {
    try {
      const validated = readWorkspace(next, false);
      if (this.write(validated)) {
        this.data = validated;
        this.fresh = false;
        return true;
      }
    } catch (error) {
      if (!(error instanceof DataFailure)) throw error;
      this.outcome = failure(error._tag);
      this.message = 'The imported workspace is invalid.';
    }
    this.message = `Import failed. Your existing workspace is unchanged. ${this.message}`;
    return false;
  }

  private write(next: Workspace) {
    if (this.blocked) return false;
    const raw = JSON.stringify(next);
    const outcome = runBoundarySync(Effect.gen({ self: this }, function* () {
      const storage = yield* storageOperation(() => this.storage());
      const existing = yield* storageOperation(() => storage.getItem(WORKSPACE_KEY));
      if ((!this.loaded && existing !== null) || existing !== this.previous) return yield* Effect.fail(failure('StorageConflict'));
      yield* storageOperation(() => storage.setItem(WORKSPACE_KEY, raw));
    }));
    this.outcome = outcome;
    if (outcome._tag === 'StorageConflict') {
      this.blocked = true;
      this.message = this.loaded
        ? 'Saved data changed in another tab. Saving is paused to protect it. Keep this tab open to copy any unsaved work, then reload to use the latest saved workspace.'
        : 'Existing saved data is now available. Saving is paused to protect it. Copy any session work, then reload to restore the saved workspace.';
      return false;
    }
    if (outcome._tag !== 'Success') { this.message = savingMessage; return false; }
    this.loaded = true;
    this.previous = raw;
    this.message = '';
    return true;
  }
}
