import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, Moon, Sun, Plus, Search, Star, Pencil, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

type Prompt = { id: string; title: string; description: string; body: string; category: string; pinned: boolean; community?: boolean };
const initial: Prompt[] = [
  { id: 'grammar', title: 'Grammar corrector', description: 'A little polish. Still your voice.', body: 'Correct the grammar, spelling, and punctuation of the text below. Preserve my meaning and voice. Use a {{tone}} tone. Return only the corrected text.\n\n{{text}}', category: 'Writing', pinned: true },
  { id: 'transcript', title: 'Clean up a transcript', description: 'Turn spoken thoughts into clear writing.', body: 'Clean up this transcript. Remove filler words and repetition, keep my meaning, and use a {{tone}} tone. Return only the edited text.\n\n{{text}}', category: 'Writing', pinned: true },
  { id: 'email', title: 'Better emails', description: 'Say what you mean, with less effort.', body: 'Rewrite this email with a {{tone}} tone. Keep the meaning and make it clear and concise.\n\n{{text}}', category: 'Writing', pinned: true },
  { id: 'plan', title: 'Notes to action plan', description: 'Find the next steps in messy notes.', body: 'Turn these notes into an action plan. Separate decisions, tasks, and unanswered questions. Do not invent deadlines.\n\n{{text}}', category: 'Planning', pinned: false },
  { id: 'explain', title: 'Explain it simply', description: 'Make a tricky idea click.', body: 'Explain the following in plain language, with one concrete example.\n\n{{text}}', category: 'Learning', pinned: false },
  { id: 'summary', title: 'A useful summary', description: 'Keep the details that matter.', body: 'Summarize the following. Highlight the main points and preserve important qualifications.\n\n{{text}}', category: 'Reading', pinned: false },
];
const examples: Prompt[] = [{ id: 'review', title: 'Thoughtful code review', description: 'Look for bugs and clearer alternatives.', body: 'Review this code for correctness and readability. Prioritize concrete issues and explain your reasoning.\n\n{{text}}', category: 'Development', pinned: false, community: true }];
const sample = "i wanted to share a quick update on the project. weve made good progress but theres a few things we still need to figure out. can we meet tomorrow to talk through the next steps?";

export default function Workspace() {
  const [variant, setVariant] = useState('A');
  const [prompts, setPrompts] = useState(initial);
  const [selected, setSelected] = useState('grammar');
  const [values, setValues] = useState<Record<string, string>>({ text: '', tone: 'natural' });
  const [provider, setProvider] = useState('T3 Chat');
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState('personal');
  const [pinned, setPinned] = useState(false);
  const [detail, setDetail] = useState(false);
  const [dark, setDark] = useState(false);
  const [edit, setEdit] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState({ title: '', body: '' });
  const [presets, setPresets] = useState(['natural', 'professional', 'concise']);
  const prompt = [...prompts, ...examples].find(p => p.id === selected) ?? prompts[0];
  const keys = [...new Set(Array.from(prompt.body.matchAll(/\{\{(\w+)\}\}/g), match => match[1]))].sort((a, b) => a === 'text' ? -1 : b === 'text' ? 1 : 0);
  const filled = prompt.body.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key]?.trim() ? values[key] : match);
  const ready = keys.every(key => values[key]?.trim());
  const visible = (collection === 'personal' ? prompts : examples).filter(p => (!pinned || p.pinned) && `${p.title} ${p.description}`.toLowerCase().includes(search.toLowerCase()));
  function changeVariant(next: string) { setVariant(next); history.replaceState(null, '', `?variant=${next}`); }
  useEffect(() => {
    setVariant(new URLSearchParams(location.search).get('variant') === 'B' ? 'B' : 'A');
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable], [role="dialog"], [role="combobox"], [role="tablist"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setVariant(old => { const next = old === 'A' ? 'B' : 'A'; history.replaceState(null, '', `?variant=${next}`); return next; }); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  async function copy() { try { await navigator.clipboard.writeText(filled); toast.success('Prompt copied'); } catch { toast.error('Could not copy. Select the text in the prompt preview.'); } }
  async function launch() {
    const base = provider === 'T3 Chat' ? 'https://t3.chat/new' : provider === 'ChatGPT' ? 'https://chatgpt.com/' : 'https://claude.ai/new';
    const url = `${base}?q=${encodeURIComponent(filled)}`;
    if (provider === 'Claude' || url.length > 6000) {
      const opened = window.open('about:blank', '_blank');
      if (!opened) { toast.error('Allow popups to open your chat app.'); return; }
      opened.opener = null;
      try { await navigator.clipboard.writeText(filled); opened.location.href = base; toast.success('Prompt copied. Paste it into your new chat.'); } catch { opened.close(); toast.error('Copy failed. Use the prompt preview to copy manually.'); }
    } else window.open(url, '_blank', 'noopener,noreferrer');
  }
  function openEditor(newPrompt = false) { setIsNew(newPrompt); setDraft(newPrompt ? { title: '', body: 'Help me with the following:\n\n{{text}}' } : { title: prompt.title, body: prompt.body }); setEdit(true); }
  function save() {
    const newCopy = isNew || prompt.community;
    const id = newCopy ? crypto.randomUUID() : prompt.id;
    const next: Prompt = { ...prompt, ...draft, id, community: false, description: newCopy ? 'Made for your workflow.' : prompt.description, category: newCopy ? 'Personal' : prompt.category };
    setPrompts(old => newCopy ? [...old, next] : old.map(p => p.id === id ? next : p)); setSelected(id); setCollection('personal'); setEdit(false); setDetail(true); toast.success('Saved for this session');
  }
  const filters = <div className="filters"><div className="search"><Search size={16}/><Input aria-label="Search prompts" placeholder="Find a prompt…" value={search} onChange={e => setSearch(e.target.value)}/></div><Button variant={pinned ? 'secondary' : 'outline'} size="icon" aria-label="Show pinned prompts" aria-pressed={pinned} onClick={() => setPinned(!pinned)}><Star/></Button></div>;
  const tabs = <Tabs value={collection} onValueChange={setCollection}><TabsList><TabsTrigger value="personal">My prompts</TabsTrigger><TabsTrigger value="examples">Curated examples</TabsTrigger></TabsList></Tabs>;
  const editor = <section className="editor">
    <div className="editor-heading"><div><p className="eyebrow">{prompt.category} / YOUR REUSABLE TOOL</p><h1>{prompt.title}</h1><p className="muted">{prompt.description}</p></div><Button variant="ghost" size="icon" aria-label="Edit template" onClick={() => openEditor()}><Pencil/></Button></div>
    {keys.includes('tone') && <div className="preset-row"><span className="muted preset-label"><SlidersHorizontal size={14}/> Presets</span><div className="preset-buttons">{presets.map(tone => <Button key={tone} size="sm" variant={values.tone === tone ? 'secondary' : 'ghost'} onClick={() => setValues(v => ({ ...v, tone }))}>{tone}</Button>)}</div><Button variant="ghost" size="sm" onClick={() => { const tone = values.tone?.trim(); if (tone && !presets.includes(tone)) { setPresets(p => [...p, tone]); toast.success('Tone preset saved for this session'); } else toast.info('Change the tone field first to save a new preset.'); }}>Save preset</Button></div>}
    <FieldGroup>{keys.map(key => <Field key={key}><div className="field-heading"><FieldLabel htmlFor={`var-${key}`}>{key === 'text' ? 'Your text' : key.charAt(0).toUpperCase() + key.slice(1)}</FieldLabel>{key === 'text' && <Button variant="ghost" size="sm" onClick={() => setValues(v => ({ ...v, text: sample }))}>Try an example</Button>}</div>{key === 'text' ? <Textarea id={`var-${key}`} className="text-entry" placeholder="Paste your transcript, rough draft, or anything you’ve written…" value={values[key] ?? ''} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}/> : <Input id={`var-${key}`} value={values[key] ?? ''} placeholder={`Enter ${key}`} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}/>}</Field>)}</FieldGroup>
    <div className="entry-note"><span>Your text is sent to the chat app when you launch.</span><span>{(values.text ?? '').length.toLocaleString()} characters</span></div>
    <div className="launch-row"><Select value={provider} onValueChange={setProvider}><SelectTrigger aria-label="Chat app"><SelectValue/></SelectTrigger><SelectContent><SelectGroup>{['T3 Chat', 'ChatGPT', 'Claude'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectGroup></SelectContent></Select><Button className="launch-button" disabled={!ready} onClick={launch}>Open in {provider}<ArrowUpRight/></Button><Button variant="outline" disabled={!ready} onClick={copy}><Copy/>Copy</Button></div>
    <details className="preview"><summary>Preview the complete prompt <span>{keys.length} variables</span></summary><pre>{filled}</pre></details>
  </section>;
  return <><header className="site-header"><div className="brand"><span className="brand-icon"><Sparkles size={19}/></span>promptroom<span className="brand-dot">.</span></div><div className="header-actions"><Badge variant="secondary">UI prototype</Badge><Button variant="ghost" size="icon" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun/> : <Moon/>}</Button><Button onClick={() => openEditor(true)}><Plus/>New prompt</Button></div></header>
    {variant === 'A' ? <main className="workbench"><aside className="sidebar"><div className="sidebar-heading"><h2>Your workspace</h2><span className="muted">{prompts.length} tools, ready when you are.</span></div>{tabs}{filters}<nav className="prompt-list" aria-label="Saved prompts">{visible.map(p => <button key={p.id} className={`prompt-nav ${p.id === selected ? 'is-selected' : ''}`} onClick={() => setSelected(p.id)}><span><strong>{p.title}</strong><small>{p.description}</small></span>{p.pinned && <Star size={14}/>}</button>)}{!visible.length && <p className="muted empty-message">No matching prompts. Try another search.</p>}</nav><div className="sidebar-note"><Sparkles size={18}/><p>Less rewriting.<br/>More getting things done.</p></div></aside>{editor}</main> : <main className="library">{detail ? <><Button className="back-button" variant="ghost" onClick={() => setDetail(false)}><ArrowLeft/>Back to your library</Button><div className="library-editor">{editor}</div></> : <><div className="library-intro"><p className="eyebrow">A SMALL LIBRARY. A BETTER EVERYDAY.</p><h1>Your words,<br/><span>with a head start.</span></h1><p className="muted">Your favorite prompts, ready to fill in and launch.<br/>Start with a familiar task. Make it yours.</p></div><div className="library-toolbar">{tabs}{filters}</div><div className="card-grid">{visible.map(p => <Card key={p.id}><CardHeader><div className="card-top"><span className="tool-icon"><Sparkles size={20}/></span>{!p.community && <Button size="icon" variant="ghost" aria-label={`${p.pinned ? 'Unpin' : 'Pin'} ${p.title}`} aria-pressed={p.pinned} onClick={() => setPrompts(old => old.map(item => item.id === p.id ? { ...item, pinned: !item.pinned } : item))}><Star fill={p.pinned ? 'currentColor' : 'none'}/></Button>}</div><CardTitle>{p.title}</CardTitle><CardDescription>{p.description}</CardDescription></CardHeader><CardContent><Badge variant="secondary">{p.category}</Badge><span className="card-meta">{new Set(Array.from(p.body.matchAll(/\{\{(\w+)\}\}/g), m => m[1])).size} variables</span></CardContent><CardFooter><Button variant="outline" className="use-button" onClick={() => { setSelected(p.id); setDetail(true); }}>Use prompt<ArrowRight/></Button></CardFooter></Card>)}</div>{!visible.length && <p className="empty-message muted">No matching prompts.</p>}</>}</main>}
    <footer className="site-footer">A personal workspace, open to everyone. <span>Prototype: edits and presets last for this session.</span></footer>
    {import.meta.env.DEV && <div className="variant-switcher"><Button variant="ghost" size="icon" aria-label="Previous layout" onClick={() => changeVariant(variant === 'A' ? 'B' : 'A')}><ArrowLeft/></Button><div><small>COMPARE LAYOUTS</small><strong>{variant === 'A' ? 'A · Personal workbench' : 'B · Personal library'}</strong></div><Button variant="ghost" size="icon" aria-label="Next layout" onClick={() => changeVariant(variant === 'A' ? 'B' : 'A')}><ArrowRight/></Button></div>}
    <Dialog open={edit} onOpenChange={setEdit}><DialogContent><DialogHeader><DialogTitle>{isNew ? 'Create a reusable prompt' : 'Edit your template'}</DialogTitle><DialogDescription>Use double braces for variables, like {'{{text}}'} or {'{{tone}}'}.</DialogDescription></DialogHeader><FieldGroup><Field><FieldLabel htmlFor="prompt-name">Name</FieldLabel><Input id="prompt-name" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}/></Field><Field><FieldLabel htmlFor="prompt-body">Template</FieldLabel><Textarea id="prompt-body" rows={8} value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}/></Field></FieldGroup><DialogFooter><Button variant="outline" onClick={() => setEdit(false)}>Cancel</Button><Button disabled={!draft.title.trim() || !draft.body.trim()} onClick={save}>Save prompt</Button></DialogFooter></DialogContent></Dialog><Toaster theme={dark ? 'dark' : 'light'}/>
  </>;
}
