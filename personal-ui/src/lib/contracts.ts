import * as Schema from 'effect/Schema';
import { chatApps } from './chat-apps';

// Wire contracts own recognized fields; readers add domain/reference checks.
// mutable preserves the existing simple React/deterministic transformation model.
export const AppSchema = Schema.Literals(chatApps.map(app => app.name));
export const T3OptionsSchema = Schema.Struct({
  model: Schema.optional(Schema.String), effort: Schema.optional(Schema.String),
  search: Schema.optional(Schema.Boolean),
  search_limit: Schema.optional(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 5 }))),
  profile: Schema.optional(Schema.String), temporary: Schema.optional(Schema.Boolean),
});
const strings = Schema.Array(Schema.String).pipe(Schema.mutable);
const values = Schema.Record(Schema.String, Schema.String);
export const TemplateSchema = Schema.Struct({
  id: Schema.String, title: Schema.String, description: Schema.String, body: Schema.String,
  chatApp: Schema.optional(AppSchema), t3Options: Schema.optional(T3OptionsSchema),
  reusableVariables: Schema.optional(strings),
});
export const ArchivedPresetSchema = Schema.Struct({
  id: Schema.String, templateId: Schema.String, name: Schema.String, values,
  app: Schema.optional(AppSchema),
});
export const WorkspaceSchema = Schema.Struct({
  version: Schema.Literal(1), templates: Schema.Array(TemplateSchema).pipe(Schema.mutable),
  favorites: strings, presets: Schema.Array(ArchivedPresetSchema).pipe(Schema.mutable),
  preferredApp: AppSchema, lastUsedPrompt: Schema.String,
});
export const BackupSchema = Schema.Struct({
  format: Schema.Literal('promptroom-backup'), version: Schema.Literal(1), workspace: WorkspaceSchema,
});
export const SnapshotSchema = Schema.Struct({
  format: Schema.Literal('promptroom-share'), version: Schema.Literal(1),
  template: Schema.Struct({ title: Schema.String, description: Schema.String, body: Schema.String }),
  values: Schema.optional(values),
});
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
export type Workspace = Mutable<typeof WorkspaceSchema.Type>;
export type PromptTemplate = Mutable<typeof TemplateSchema.Type>;
export type T3Options = Mutable<typeof T3OptionsSchema.Type>;
export type ShareSnapshot = Mutable<typeof SnapshotSchema.Type>;
