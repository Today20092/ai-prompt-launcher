import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowUpRight, Copy, Moon, Pencil, Plus, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { renderPrompt, type PromptTemplate } from '@/lib/prompt';
import { starterTemplates } from '@/lib/templates';
import { cn } from '@/lib/utils';

const chatApps = [
  { name: 'T3 Chat', url: 'https://t3.chat/new' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Claude', url: 'https://claude.ai/new' },
];
const variableLabel = (name: string) => name === 'text' ? 'Your text' : name.replace(/[_-]/g, ' ');

export default function Workbench() {
  const [templates, setTemplates] = useState(starterTemplates);
  const [selected, setSelected] = useState('grammar');
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [appName, setAppName] = useState('T3 Chat');
  const [dark, setDark] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', body: '' });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const fields = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const preview = useRef<HTMLDetailsElement>(null);
  const previewText = useRef<HTMLPreElement>(null);
  const template = templates.find(item => item.id === selected) ?? templates[0];
  const values = inputs[template.id] ?? {};
  const rendered = renderPrompt(template.body, values);
  const app = chatApps.find(item => item.name === appName) ?? chatApps[0];
  const draftVariables = renderPrompt(draft.body, {}).variables;

  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);

  function switchTemplate(id: string) {
    setSelected(id);
    setAttempted(false);
    setStatus('');
    setManualCopy(false);
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark', !dark);
    setDark(!dark);
  }

  function openEditor(event: MouseEvent<HTMLButtonElement>, isNew = false) {
    opener.current = event.currentTarget;
    setCreating(isNew);
    setDraft(isNew ? { title: '', description: '', body: 'Help me with the following:\n\n{{text}}' } : template);
    setSaveAttempted(false);
    setEditing(true);
  }

  function saveTemplate(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveAttempted(true);
    if (!draft.title.trim() || !draft.body.trim()) {
      document.getElementById(!draft.title.trim() ? 'template-title' : 'template-body')?.focus();
      return;
    }
    const next: PromptTemplate = {
      id: creating ? crypto.randomUUID() : template.id,
      title: draft.title.trim(), description: draft.description.trim(), body: draft.body,
    };
    setTemplates(old => creating ? [...old, next] : old.map(item => item.id === next.id ? next : item));
    switchTemplate(next.id);
    setEditing(false);
    setStatus('Template saved for this session. Fill its variables below.');
  }

  function checkRequired() {
    setAttempted(true);
    if (!rendered.missing.length) return true;
    setStatus('Fill the required fields before copying or opening your chat app.');
    fields.current[rendered.missing[0]]?.focus();
    return false;
  }

  function showManualCopy() {
    setManualCopy(true);
    if (preview.current) preview.current.open = true;
    previewText.current?.focus();
    setStatus('Clipboard access failed. Select and copy the complete prompt below, then open your chat app.');
  }

  async function copyPrompt() {
    if (!checkRequired()) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(rendered.text);
      setManualCopy(false);
      setStatus('Complete prompt copied.');
    } catch { showManualCopy(); }
    finally { setBusy(false); }
  }

  async function launchPrompt() {
    if (!checkRequired()) return;
    // Open during the user gesture, before awaiting clipboard permission.
    const destination = window.open('about:blank', '_blank');
    if (!destination) {
      setStatus('Your browser blocked the new tab. Use Copy prompt, then open your chat app below.');
      setManualCopy(true);
      return;
    }
    destination.opener = null;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(rendered.text);
      destination.location.replace(app.url);
      setManualCopy(false);
      setStatus(`Prompt copied. Paste it into ${app.name} to send.`);
    } catch {
      destination.close();
      showManualCopy();
    } finally { setBusy(false); }
  }

  return <>
    <a className="skip-link" href="#workspace">Skip to prompt</a>
    <header className="app-header">
      <a href="#workspace" className="brand"><Sparkles aria-hidden="true" />Promptroom</a>
      <div className="header-actions">
        <Button variant="ghost" size="icon" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={toggleTheme}>{dark ? <Sun /> : <Moon />}</Button>
        <Button variant="outline" onClick={event => openEditor(event, true)}><Plus data-icon="inline-start" />New prompt</Button>
      </div>
    </header>
    <main className="workbench">
      <aside className="library" aria-label="Prompt library">
        <h2>Your prompts</h2>
        <p className="muted">Reusable templates</p>
        <nav aria-label="Choose a prompt" className="prompt-list">
          {templates.map(item => <button key={item.id} type="button" className={cn('prompt-nav', item.id === selected && 'is-selected')} aria-current={item.id === selected ? 'true' : undefined} onClick={() => switchTemplate(item.id)}>
            <strong>{item.title}</strong><span>{item.description || 'Your custom template'}</span>
          </button>)}
        </nav>
        <p className="session-note">Edits stay in this tab until you reload.</p>
      </aside>
      <section id="workspace" className="workspace" aria-labelledby="prompt-title" tabIndex={-1}>
        <div className="mobile-picker">
          <Field><FieldLabel htmlFor="prompt-picker">Your prompts</FieldLabel>
            <Select value={selected} onValueChange={switchTemplate}><SelectTrigger id="prompt-picker"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>{templates.map(item => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </Field>
        </div>
        <div className="workspace-heading">
          <div><h1 id="prompt-title">{template.title}</h1>{template.description && <p className="muted">{template.description}</p>}</div>
          <Button variant="ghost" size="icon" aria-label="Edit template" onClick={event => openEditor(event)}><Pencil /></Button>
        </div>
        <FieldGroup className="variable-fields">
          {rendered.variables.map((name, index) => {
            const invalid = attempted && rendered.missing.includes(name);
            return <Field key={`${template.id}-${name}`} data-invalid={invalid}>
              <div className="field-heading"><FieldLabel htmlFor={`variable-${index}`}>{variableLabel(name)}</FieldLabel><span className="muted required-label">Required</span></div>
              <Textarea ref={element => { fields.current[name] = element; }} id={`variable-${index}`} rows={name === 'text' ? 7 : 3} className="variable-input" value={values[name] ?? ''}
                aria-invalid={invalid} aria-required="true" aria-describedby={invalid ? `error-${index}` : undefined}
                placeholder={name === 'text' ? 'Paste your draft or transcript here…' : `Enter ${variableLabel(name)}…`}
                onChange={event => { setInputs(old => ({ ...old, [template.id]: { ...values, [name]: event.target.value } })); setStatus(''); setManualCopy(false); }} />
              {invalid && <FieldError id={`error-${index}`}>Enter {variableLabel(name).toLowerCase()}.</FieldError>}
            </Field>;
          })}
        </FieldGroup>
        <div className="entry-meta"><span>{rendered.variables.length ? 'Multiline text is welcome.' : 'This template has no variables. It is ready to use.'}</span><span>{rendered.text.length.toLocaleString()} characters in prompt</span></div>
        <div className="launch-panel">
          <Field className="app-picker"><FieldLabel htmlFor="chat-app">Chat app</FieldLabel>
            <Select value={appName} onValueChange={name => { setAppName(name); setStatus(''); }}><SelectTrigger id="chat-app"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>{chatApps.map(item => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </Field>
          <div className="launch-actions">
            <Button disabled={busy} onClick={launchPrompt}>Open in {app.name}<ArrowUpRight data-icon="inline-end" /></Button>
            <Button variant="outline" disabled={busy} onClick={copyPrompt}><Copy data-icon="inline-start" />Copy prompt</Button>
          </div>
          <p className="launch-help">Copies your complete prompt, then opens a new chat. Paste to send.</p>
          <p className="readiness" aria-live="polite">{rendered.missing.length ? `Still needed: ${rendered.missing.map(variableLabel).join(', ')}.` : 'Ready to copy or open.'}</p>
          <p role="status" className="action-status">{status}</p>
          {manualCopy && <a className="manual-link" href={app.url} target="_blank" rel="noopener noreferrer">Open {app.name} manually<ArrowUpRight aria-hidden="true" /></a>}
        </div>
        <details ref={preview} className="preview">
          <summary><span>Preview complete prompt</span><Badge variant="secondary">{rendered.variables.length} {rendered.variables.length === 1 ? 'variable' : 'variables'}</Badge></summary>
          <pre ref={previewText} tabIndex={0} aria-label="Complete prompt">{rendered.text}</pre>
        </details>
        <p className="mobile-session-note">Edits stay in this tab until you reload.</p>
      </section>
    </main>
    <Dialog open={editing} onOpenChange={setEditing}>
      <DialogContent className="template-dialog" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
        <DialogHeader><DialogTitle>{creating ? 'New reusable prompt' : 'Edit template'}</DialogTitle>
          <DialogDescription>Use {'{{text}}'} for a variable. Each named variable becomes a required multiline field.</DialogDescription>
        </DialogHeader>
        <form onSubmit={saveTemplate} noValidate>
          <FieldGroup>
            <Field data-invalid={saveAttempted && !draft.title.trim()}><FieldLabel htmlFor="template-title">Name</FieldLabel>
              <Input id="template-title" value={draft.title} aria-required="true" aria-invalid={saveAttempted && !draft.title.trim()} aria-describedby={saveAttempted && !draft.title.trim() ? 'title-error' : undefined} onChange={event => setDraft(old => ({ ...old, title: event.target.value }))} />
              {saveAttempted && !draft.title.trim() && <FieldError id="title-error">Give your prompt a name.</FieldError>}
            </Field>
            <Field><FieldLabel htmlFor="template-description">Description <span className="muted">optional</span></FieldLabel>
              <Input id="template-description" value={draft.description} onChange={event => setDraft(old => ({ ...old, description: event.target.value }))} />
            </Field>
            <Field data-invalid={saveAttempted && !draft.body.trim()}><FieldLabel htmlFor="template-body">Template</FieldLabel>
              <Textarea id="template-body" rows={7} value={draft.body} aria-required="true" aria-invalid={saveAttempted && !draft.body.trim()} aria-describedby={saveAttempted && !draft.body.trim() ? 'variable-guide body-error' : 'variable-guide'} onChange={event => setDraft(old => ({ ...old, body: event.target.value }))} />
              <FieldDescription id="variable-guide">Names use letters, digits, underscores or hyphens and start with a letter or underscore. Example: {'{{source_text}}'}. Repeated names share one field.</FieldDescription>
              {saveAttempted && !draft.body.trim() && <FieldError id="body-error">Enter a template.</FieldError>}
              <FieldDescription>{draftVariables.length ? `Fields: ${draftVariables.join(', ')}.` : 'No variables. The template will be copied as written.'}</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="editor-footer"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit">Save template</Button></DialogFooter>
          <p className="editor-note">Saved for this session only.</p>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
