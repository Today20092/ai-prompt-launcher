import { decodeContract } from './validation';
import { T3OptionsSchema, type T3Options } from './contracts';
export type { T3Options } from './contracts';

export function readT3Options(value: unknown): T3Options {
  const options = decodeContract(T3OptionsSchema, value);
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) as T3Options;
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
