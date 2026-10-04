import { expect, test } from 'vitest';
import { renderPrompt } from './prompt';

test('fills repeated named variables while preserving multiline input literally', () => {
  expect(renderPrompt('For {{person}}:\n{{text}}\nThanks, {{ person }}.', {
    person: 'Sam', text: '  First line\n$& {{person}} <b>second line</b>  ',
  })).toEqual({
    text: 'For Sam:\n  First line\n$& {{person}} <b>second line</b>  \nThanks, Sam.',
    variables: ['person', 'text'],
    missing: [],
  });
});

test('reports every missing required value once and keeps its placeholder in the preview', () => {
  expect(renderPrompt('Write to {{recipient}}: {{text}}. Again {{recipient}}. In {{tone}}.', {
    recipient: ' \n ', tone: 'warm',
  })).toEqual({
    text: 'Write to {{recipient}}: {{text}}. Again {{recipient}}. In warm.',
    variables: ['recipient', 'text', 'tone'],
    missing: ['recipient', 'text'],
  });
});

test('a template without variables is ready and stays unchanged', () => {
  expect(renderPrompt('Write a short poem about rain.', {})).toEqual({
    text: 'Write a short poem about rain.', variables: [], missing: [],
  });
});

test('named fields support underscores and hyphens without accepting inherited values', () => {
  expect(renderPrompt('{{source_text}} / {{source-text}} / {{constructor}}', {
    source_text: 'first\nsecond', 'source-text': '0',
  })).toEqual({
    text: 'first\nsecond / 0 / {{constructor}}',
    variables: ['source_text', 'source-text', 'constructor'], missing: ['constructor'],
  });
});
