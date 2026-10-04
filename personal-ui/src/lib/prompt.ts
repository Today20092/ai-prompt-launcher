import type { AppName } from './chat-apps';
import type { T3Options } from './t3';

export type PromptTemplate = { id: string; title: string; description: string; body: string; chatApp?: AppName; t3Options?: T3Options; reusableVariables?: string[] };

// Names start with a letter or underscore, followed by letters, digits, underscores or hyphens.
// Whitespace around the name is allowed. Values are inserted once, without interpreting their content.
export function renderPrompt(body: string, values: Readonly<Record<string, string>>) {
  const variables: string[] = [];
  const missing: string[] = [];
  const text = body.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*\}\}/g, (placeholder, name: string) => {
    if (!variables.includes(name)) variables.push(name);
    const value = Object.hasOwn(values, name) ? values[name] : '';
    if (!value.trim()) {
      if (!missing.includes(name)) missing.push(name);
      return placeholder;
    }
    return value;
  });
  return { text, variables, missing };
}
