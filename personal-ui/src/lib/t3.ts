export type T3Options = { model?: string; effort?: string; search?: boolean; search_limit?: number; profile?: string; temporary?: boolean };

export function readT3Options(value: unknown): T3Options {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid T3 options');
  const options = value as Record<string, unknown>;
  for (const name of ['model', 'effort', 'profile']) if (options[name] !== undefined && typeof options[name] !== 'string') throw new Error('Invalid T3 text option');
  for (const name of ['search', 'temporary']) if (options[name] !== undefined && typeof options[name] !== 'boolean') throw new Error('Invalid T3 boolean option');
  if (options.search_limit !== undefined && (typeof options.search_limit !== 'number' || !Number.isInteger(options.search_limit) || options.search_limit < 1 || options.search_limit > 5)) throw new Error('Invalid T3 search limit');
  return Object.fromEntries(['model', 'effort', 'search', 'search_limit', 'profile', 'temporary'].filter(name => options[name] !== undefined).map(name => [name, options[name]])) as T3Options;
}

// Conservative application policy, not a claimed T3/browser limit. Long prompts use clipboard.
export const T3_URL_BUDGET = 2000;
export function t3Handoff(prompt: string, options: T3Options = {}) {
  const url = new URL('https://t3.chat/new');
  url.searchParams.set('q', prompt);
  for (const [name, value] of Object.entries(readT3Options(options))) {
    if (typeof value === 'string' && !value.trim()) continue;
    if (name === 'search_limit' && options.search === false) continue;
    url.searchParams.set(name, typeof value === 'string' ? value.trim() : String(value));
  }
  return { url: url.toString(), direct: url.toString().length <= T3_URL_BUDGET };
}
