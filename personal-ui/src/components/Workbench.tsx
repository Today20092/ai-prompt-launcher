import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowUpRight, Copy, Moon, Pencil, Plus, Settings2, Sparkles, Star, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { renderPrompt, type PromptTemplate } from '@/lib/prompt';
import { newWorkspace, updateTemplate, WorkspaceStore, type Workspace } from '@/lib/workspace';
import { chatApps, type AppName } from '@/lib/chat-apps';
import { cn } from '@/lib/utils';
import { t3Handoff, type T3Options } from '@/lib/t3';
import BackupControls from '@/components/BackupControls';
import { templateLabel } from '@/lib/backup';
import ShareControls from '@/components/ShareControls';
import { readShareLink, saveReceivedCopy, shareRecovery, type ShareSnapshot } from '@/lib/sharing';

const variableLabel = (name: string) => name === 'text' ? 'Your text' : name.replace(/[_-]/g, ' ');

export default function Workbench() {
  const [workspace, setWorkspace] = useState(newWorkspace);
  const [received, setReceived] = useState<PromptTemplate | null>(null);
  const [receivedStatus, setReceivedStatus] = useState('');
  const { templates, lastUsedPrompt: selected } = workspace;
  const store = useRef<WorkspaceStore | null>(null);
  const [ready, setReady] = useState(false);
  const [savingStatus, setSavingStatus] = useState('');
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [dark, setDark] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', body: '' });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const fields = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const preview = useRef<HTMLDetailsElement>(null);
  const previewText = useRef<HTMLPreElement>(null);
  const template = received ?? templates.find(item => item.id === selected) ?? templates[0];
  const values = inputs[template.id] ?? {};
  const rendered = renderPrompt(template.body, values);
  const appName = template.chatApp ?? workspace.preferredApp;
  const app = chatApps.find(item => item.name === appName) ?? chatApps[0];
  const draftVariables = renderPrompt(draft.body, {}).variables;
  const favorite = workspace.favorites.includes(template.id);
  const t3Options = template.t3Options ?? {};
  const handoff = app.name === 'T3 Chat' ? t3Handoff(rendered.text, t3Options) : null;
  const directT3 = handoff?.direct ?? false;

  function setT3Options(change: Partial<T3Options>) {
    changeTemplate({ ...template, t3Options: { ...t3Options, ...change } });
    setStatus('');
    setManualCopy(false);
  }

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    const storage = new WorkspaceStore(() => window.localStorage);
    const restored = storage.load();
    store.current = storage;
    setWorkspace(restored);
    setSavingStatus(storage.message);
    try {
      const incoming = readShareLink(window.location.href);
      if (incoming) receive(incoming);
    } catch { setReceivedStatus(shareRecovery); }
    setReady(true);
  }, []);

  function receive(snapshot: ShareSnapshot) {
    const temporary = { ...snapshot.template, id: crypto.randomUUID() };
    setReceived(temporary);
    setInputs(old => ({ ...old, [temporary.id]: snapshot.values ?? {} }));
    setReceivedStatus('Received prompt. Edits and included values are temporary. Save a copy explicitly to keep the reusable template.');
    setAttempted(false); setStatus(''); setManualCopy(false);
  }

  function changeTemplate(next: PromptTemplate) {
    if (received) setReceived(next);
    else persist(updateTemplate(workspace, next));
  }

  function saveCopy() {
    if (!received || !store.current) return;
    try {
      const { next } = saveReceivedCopy(workspace, received);
      if (!store.current.importWorkspace(next)) { setReceivedStatus(store.current.message); return; }
      setWorkspace(store.current.data);
      setReceivedStatus('Independent template copy saved. Included input was excluded. Your last-used selection and preferences are unchanged.');
    } catch { setReceivedStatus('This template exceeds the single-prompt budget or is invalid. Copy its full text before leaving.'); }
  }

  function persist(next: Workspace) {
    if (!store.current) return;
    store.current.save(next);
    setWorkspace(store.current.data);
    setSavingStatus(store.current.message);
  }

  function switchTemplate(id: string) {
    setReceived(null); setReceivedStatus('');
    persist({ ...workspace, lastUsedPrompt: id });
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
      title: received && !creating ? draft.title : draft.title.trim(), description: received && !creating ? draft.description : draft.description.trim(), body: draft.body,
    };
    if (creating) { setReceived(null); setReceivedStatus(''); persist(updateTemplate(workspace, next)); }
    else changeTemplate(next);
    setAttempted(false);
    setManualCopy(false);
    setEditing(false);
    setStatus(received && !creating ? 'Temporary template updated. Save a copy to keep it.' : 'Template updated. Fill its variables below.');
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
    if (handoff?.direct) {
      window.open(handoff.url, '_blank', 'noopener,noreferrer');
      // noopener can return null even when the tab opens; always offer a retry link.
      setManualCopy(true);
      setStatus('Opening T3 Chat with your prompt as the first message. If no tab opens, use the send link below.');
      return;
    }
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
      setStatus(handoff ? 'Long prompt copied in full. Paste it into T3 Chat and set your model, search and profile there. URL options cannot be applied on this copy-and-paste path.' : `Prompt copied. Paste it into ${app.name} to send.`);
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
        <Button variant="ghost" size="icon" disabled={!ready} aria-label="Preferences" onClick={event => { opener.current = event.currentTarget; setPreferencesOpen(true); }}><Settings2 /></Button>
        <Button variant="ghost" size="icon" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={toggleTheme}>{dark ? <Sun /> : <Moon />}</Button>
        <Button variant="outline" disabled={!ready} onClick={event => openEditor(event, true)}><Plus data-icon="inline-start" />New prompt</Button>
      </div>
    </header>
    {!ready && <p role="status" className="storage-status">Loading your saved workspace...</p>}
    <main className="workbench" inert={!ready}>
      <aside className="library" aria-label="Prompt library">
        <h2>Your prompts</h2>
        <p className="muted">Reusable templates</p>
        <nav aria-label="Choose a prompt" className="prompt-list">
          {templates.map(item => <button key={item.id} type="button" className={cn('prompt-nav', item.id === selected && 'is-selected')} aria-current={item.id === selected ? 'true' : undefined} onClick={() => switchTemplate(item.id)}>
              <strong>{workspace.favorites.includes(item.id) && <Star aria-label="Favorite" className="favorite-icon" />}{templateLabel(item, templates)}</strong><span>{item.description || 'Your custom template'}</span>
          </button>)}
        </nav>
        <p className="session-note">Prompts and their chat apps stay in this browser. Pasted input stays temporary.</p>
      </aside>
      <section id="workspace" className="workspace" aria-labelledby="prompt-title" tabIndex={-1}>
        {receivedStatus && <div className="storage-status" role="status"><p>{receivedStatus}</p>{received && <Button variant="outline" onClick={saveCopy}>Save a copy</Button>}<Button variant="ghost" onClick={() => { setReceived(null); setReceivedStatus(''); setStatus(''); setManualCopy(false); }}>Return to saved workspace</Button></div>}
        <div className="mobile-picker">
          <Field><FieldLabel htmlFor="prompt-picker">Your prompts</FieldLabel>
            <Select value={received ? '' : selected} onValueChange={switchTemplate}><SelectTrigger id="prompt-picker"><SelectValue placeholder="Temporary received prompt" /></SelectTrigger>
              <SelectContent><SelectGroup>{templates.map(item => <SelectItem key={item.id} value={item.id}>{workspace.favorites.includes(item.id) ? '★ ' : ''}{templateLabel(item, templates)}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </Field>
        </div>
        <div className="workspace-heading">
          <div className="workspace-heading-text"><h1 id="prompt-title">{templateLabel(template, templates)}</h1>{template.description && <p className="muted">{template.description}</p>}</div>
          <div className="prompt-actions">
            <ShareControls key={template.id} template={template} values={values} onReceived={receive} />
            <Button variant="ghost" size="icon" disabled={Boolean(received)} aria-label={favorite ? 'Remove favorite' : 'Add favorite'} aria-pressed={favorite} onClick={() => persist({ ...workspace, favorites: favorite ? workspace.favorites.filter(id => id !== template.id) : [...workspace.favorites, template.id] })}><Star fill={favorite ? 'currentColor' : 'none'} /></Button>
            <Button variant="ghost" size="icon" aria-label="Edit template" onClick={event => openEditor(event)}><Pencil /></Button>
          </div>
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
        <div className="entry-meta">{!rendered.variables.length && <span>This template has no variables. It is ready to use.</span>}<span>{rendered.text.length.toLocaleString()} characters in prompt</span></div>
        <div className="launch-panel">
          <Field className="app-picker"><FieldLabel htmlFor="chat-app">Chat app</FieldLabel>
              <Select value={template.chatApp ?? 'preferred'} onValueChange={name => { changeTemplate({ ...template, chatApp: name === 'preferred' ? undefined : name as AppName }); setStatus(''); setManualCopy(false); }}><SelectTrigger id="chat-app"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup><SelectItem value="preferred">Use preferred ({workspace.preferredApp})</SelectItem>{chatApps.map(item => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </Field>
          <div className="launch-actions">
            <Button disabled={busy} onClick={launchPrompt}>{directT3 ? 'Send to T3 Chat' : `Open in ${app.name}`}<ArrowUpRight data-icon="inline-end" /></Button>
            <Button variant="outline" disabled={busy} onClick={copyPrompt}><Copy data-icon="inline-start" />Copy prompt</Button>
          </div>
          {app.name === 'T3 Chat' && <details key={template.id} className="t3-options">
            <summary><span>T3 Chat options</span><span className="muted">Saved for this prompt</span></summary>
            <div className="t3-options-body">
              <p className="muted">Leave options blank to use T3 defaults. <a href="https://t3.chat/faq" target="_blank" rel="noopener noreferrer">URL documentation</a></p>
              <div className="t3-options-grid">
                <Field><FieldLabel htmlFor="t3-model">Model ID</FieldLabel><Input id="t3-model" value={t3Options.model ?? ''} placeholder="T3 default" onChange={event => setT3Options({ model: event.target.value })} /><FieldDescription>Use the model ID from T3 Settings → Models → Copy Search URL.</FieldDescription></Field>
                <Field><FieldLabel htmlFor="t3-effort">Reasoning effort</FieldLabel><Input id="t3-effort" value={t3Options.effort ?? ''} placeholder="Model default" onChange={event => setT3Options({ effort: event.target.value })} /><FieldDescription>Use a value supported by your model. T3 falls back to its default for unsupported values.</FieldDescription></Field>
                <Field><FieldLabel htmlFor="t3-search">Web search</FieldLabel><Select value={t3Options.search === undefined ? 'default' : String(t3Options.search)} onValueChange={value => setT3Options({ search: value === 'default' ? undefined : value === 'true' })}><SelectTrigger id="t3-search"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="default">T3 default</SelectItem><SelectItem value="true">On</SelectItem><SelectItem value="false">Off</SelectItem></SelectGroup></SelectContent></Select></Field>
                <Field><FieldLabel htmlFor="t3-search-limit">Search limit</FieldLabel><Select disabled={t3Options.search === false} value={t3Options.search_limit === undefined ? 'default' : String(t3Options.search_limit)} onValueChange={value => setT3Options({ search_limit: value === 'default' ? undefined : Number(value) })}><SelectTrigger id="t3-search-limit"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="default">T3 default</SelectItem>{[1,2,3,4,5].map(limit => <SelectItem key={limit} value={String(limit)}>{limit} {limit === 1 ? 'query' : 'queries'}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldDescription>Maximum search queries or tools, from 1 to 5.</FieldDescription></Field>
                <Field><FieldLabel htmlFor="t3-profile">Profile</FieldLabel><Input id="t3-profile" value={t3Options.profile ?? ''} placeholder="T3 default" onChange={event => setT3Options({ profile: event.target.value })} /><FieldDescription>Profile name or ID.</FieldDescription></Field>
                <Field><FieldLabel htmlFor="t3-temporary">Temporary chat</FieldLabel><Select value={t3Options.temporary === undefined ? 'default' : String(t3Options.temporary)} onValueChange={value => setT3Options({ temporary: value === 'default' ? undefined : value === 'true' })}><SelectTrigger id="t3-temporary"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="default">T3 default</SelectItem><SelectItem value="true">On</SelectItem><SelectItem value="false">Off</SelectItem></SelectGroup></SelectContent></Select><FieldDescription>On creates a chat that T3 does not persist.</FieldDescription></Field>
              </div>
              <Button variant="ghost" onClick={() => { changeTemplate({ ...template, t3Options: undefined }); setStatus('T3 options reset to defaults.'); }}>Reset options</Button>
            </div>
          </details>}
          <p className="launch-help">{directT3 ? 'Sends your complete prompt as the first message in a new T3 chat, with the options above.' : handoff ? 'This prompt is long. Copies it in full, then opens T3 Chat. Paste to send and choose your options there.' : 'Copies your complete prompt, then opens a new chat. Paste to send.'}</p>
          <p className="readiness" aria-live="polite">{rendered.missing.length ? `Still needed: ${rendered.missing.map(variableLabel).join(', ')}.` : 'Ready to copy or open.'}</p>
          <p role="status" className="action-status">{status}</p>
          {manualCopy && <a className="manual-link" href={directT3 ? handoff?.url : app.url} target="_blank" rel="noopener noreferrer">{directT3 ? 'Send to T3 Chat manually' : `Open ${app.name} manually`}<ArrowUpRight aria-hidden="true" /></a>}
        </div>
        <details ref={preview} className="preview">
          <summary><span>Preview complete prompt</span><Badge variant="secondary">{rendered.variables.length} {rendered.variables.length === 1 ? 'variable' : 'variables'}</Badge></summary>
          <pre ref={previewText} tabIndex={0} aria-label="Complete prompt">{rendered.text}</pre>
        </details>
        <p className="mobile-session-note">Prompts and their chat apps stay in this browser. Pasted input stays temporary.</p>
          <p className="storage-note">Saved only on this device and browser. Clearing site data removes your saved workspace.</p>
        {savingStatus && <div className="storage-status" role="status"><p>{savingStatus}</p><Button variant="outline" onClick={() => persist(workspace)}>Retry saving</Button></div>}
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
          <p className="editor-note">{received && !creating ? 'Changes stay temporary until you choose Save a copy.' : 'Template changes are saved in this browser.'}</p>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
        <DialogHeader><DialogTitle>Preferences</DialogTitle><DialogDescription>Your preferred app is used for prompts without their own app choice. Saved in this browser.</DialogDescription></DialogHeader>
        <Field><FieldLabel htmlFor="preferred-app">Preferred chat app</FieldLabel>
          <Select value={workspace.preferredApp} onValueChange={name => { persist({ ...workspace, preferredApp: name as AppName }); setStatus(''); setManualCopy(false); }}><SelectTrigger id="preferred-app"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{chatApps.map(item => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          <FieldDescription>T3 Chat is the default. Choose another app here, or override it for an individual prompt.</FieldDescription>
        </Field>
        <BackupControls workspace={workspace} store={store.current} onImported={next => { setWorkspace(next); setSavingStatus(''); setAttempted(false); setManualCopy(false); setStatus(''); }} />
        <DialogFooter><Button onClick={() => setPreferencesOpen(false)}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
