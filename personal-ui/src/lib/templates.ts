import type { PromptTemplate } from './prompt';

export const starterTemplates: PromptTemplate[] = [
  {
    id: 'grammar', title: 'Grammar corrector',
    description: 'Correct your writing while keeping your meaning and voice.',
    body: 'Correct the grammar, spelling, and punctuation of the text below. Preserve my meaning and voice. Return only the corrected text.\n\n{{text}}',
  },
  {
    id: 'transcript', title: 'Transcript cleanup',
    description: 'Remove filler and repetition from spoken thoughts.',
    body: 'Clean up this transcript. Remove filler words and repetition, preserve my meaning and voice, and make the writing clear. Do not add information. Return only the edited text.\n\n{{text}}',
  },
];
