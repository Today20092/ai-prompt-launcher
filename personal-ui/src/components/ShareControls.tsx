import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createSnapshot, exportPrompt, readSnapshot, shareLink, SHARE_FILE_LIMIT, shareRecovery, type ShareSnapshot } from '@/lib/sharing';
import { renderPrompt, type PromptTemplate } from '@/lib/prompt';

type Props = { template: PromptTemplate; values: Record<string, string>; onReceived: (snapshot: ShareSnapshot) => void };

export default function ShareControls({ template, values, onReceived }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const rendered = renderPrompt(template.body, values);
  const snapshot = createSnapshot(template, values, selected);
  const link = typeof window === 'undefined' ? null : shareLink(snapshot, window.location.href);
  const preview = JSON.stringify(snapshot, null, 2);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function changeOpen(next: boolean) {
    generation.current++;
    setOpen(next); setSelected([]); setStatus(''); setManual(''); setBusy(false);
  }

  async function copy(text: string, message: string) {
    setBusy(true);
    try { await navigator.clipboard.writeText(text); setStatus(message); setManual(''); }
    catch { setManual(text); setStatus('Clipboard access failed. Select and copy the complete text below.'); }
    finally { setBusy(false); }
  }

  async function deviceShare() {
    if (!link) return;
    setBusy(true);
    try {
      const data = { url: link };
      if (navigator.canShare && !navigator.canShare(data)) { setStatus('The device cannot share this link. Use Copy link or download the template.'); return; }
      await navigator.share(data);
      setStatus('Link handed to the device share menu.');
    } catch (error) {
      setStatus(error instanceof Error && error.name === 'AbortError' ? 'Sharing cancelled. You can still copy or download.' : 'Device sharing failed. Use Copy link or download the template.');
    } finally { setBusy(false); }
  }

  function download() {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([exportPrompt(template)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'promptroom-prompt.json';
      document.body.append(anchor);
      try { anchor.click(); } finally { anchor.remove(); }
      setStatus('Template download requested. Check your downloads. Current input is excluded.');
    } catch { setManual(template.body); setStatus('Template download failed or exceeds the 256 KiB file budget. Copy the complete template below.'); }
    finally { if (url) { const created = url; window.setTimeout(() => URL.revokeObjectURL(created), 1000); } }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button variant="ghost" className="share-trigger"><Share2 data-icon="inline-start" />Share</Button></DialogTrigger>
    <DialogContent className="share-dialog">
      <DialogHeader><DialogTitle>Share prompt</DialogTitle><DialogDescription>Send a reusable template. Include filled values only if you choose them below.</DialogDescription></DialogHeader>
      <FieldSet><FieldLegend>Link content</FieldLegend>
        <FieldDescription>{selected.length ? 'Template with selected temporary values. Anyone with the link can read them.' : 'Template only. Your pasted input stays private.'}</FieldDescription>
        <FieldGroup>{rendered.variables.map((name, index) => <Field key={name} orientation="horizontal">
          <input type="checkbox" id={`share-value-${index}`} className="accent-primary focus-visible:outline-2 focus-visible:outline-ring" checked={selected.includes(name)} onChange={event => { setSelected(old => event.target.checked ? [...old, name] : old.filter(item => item !== name)); setStatus(''); setManual(''); }} />
          <FieldLabel htmlFor={`share-value-${index}`}>Include {name}</FieldLabel>
        </Field>)}</FieldGroup>
      </FieldSet>
      <section className="share-preview" aria-labelledby="share-preview-heading">
        <h2 id="share-preview-heading">What you’re sharing</h2>
        <dl className="share-definition">
          <div><dt>Name</dt><dd>{snapshot.template.title}</dd></div>
          {snapshot.template.description && <div><dt>Description</dt><dd>{snapshot.template.description}</dd></div>}
          <div><dt>Template</dt><dd><pre tabIndex={0} aria-label="Shared template body">{snapshot.template.body}</pre></dd></div>
          {Object.entries(snapshot.values ?? {}).map(([name, value]) => <div key={name}><dt>Included value: {name}</dt><dd><pre tabIndex={0} aria-label={`Shared value ${name}`}>{value || '(empty value)'}</pre></dd></div>)}
        </dl>
      </section>
      {!link && <p role="status">This full URL exceeds 8,000 characters. Nothing is truncated. Copy the full template or filled prompt, or download a template-only JSON file.</p>}
      <div className="share-link-actions">
        <Button disabled={!link || busy} onClick={() => link && copy(link, 'Snapshot link copied.')}>Copy link</Button>
        {canShare && <Button variant="outline" disabled={!link || busy} onClick={deviceShare}>Device share menu</Button>}
      </div>
      <p className="share-note">Links keep this snapshot even if you edit later. They have no expiry or revocation.</p>
      {!canShare && <p className="share-note">Device sharing is unavailable here. Use Copy link or a file instead.</p>}
      <section className="share-alternatives" aria-labelledby="share-copy-heading">
        <h2 id="share-copy-heading">Or copy the text</h2>
        <div className="share-text-actions">
        <Button variant="outline" disabled={busy} onClick={() => copy(template.body, 'Unfilled template copied.')}>Copy template</Button>
        <Button variant="outline" disabled={busy} onClick={() => { if (rendered.missing.length) { setStatus(`Fill required fields first: ${rendered.missing.join(', ')}.`); return; } void copy(rendered.text, 'Complete filled prompt copied.'); }}>Copy filled prompt</Button>
        </div>
      </section>
      <details className="share-details">
        <summary>Transfer a template file</summary>
        <div className="share-details-body">
        <p className="share-note">Save or open one reusable template. Downloads exclude all pasted input.</p>
        <Button variant="outline" onClick={download}>Download template JSON</Button>
      <Field><FieldLabel htmlFor="single-prompt-file">Open single-prompt JSON</FieldLabel><Input id="single-prompt-file" type="file" accept=".json,application/json" onChange={async event => {
        const file = event.target.files?.[0]; const attempt = ++generation.current;
        if (!file) return;
        try {
          if (file.size > SHARE_FILE_LIMIT) throw new Error(shareRecovery);
          const incoming = readSnapshot(await file.text());
          if (attempt !== generation.current) return;
          onReceived(incoming); changeOpen(false);
        } catch { if (attempt === generation.current) setStatus(shareRecovery); }
      }} /></Field>
        </div>
      </details>
      <details className="share-details">
        <summary>View link and snapshot data</summary>
        <div className="share-details-body">
          <p className="share-note">Anyone with the link can read its contents. URL encoding formats the data for transport; it does not encrypt it.</p>
          {link && <Field><FieldLabel htmlFor="share-link">Link to copy or share</FieldLabel><Textarea id="share-link" readOnly rows={3} value={link} /></Field>}
          <Field><FieldLabel htmlFor="share-preview">Exact snapshot data</FieldLabel><Textarea id="share-preview" readOnly rows={7} value={preview} /></Field>
        </div>
      </details>
      {manual && <Field><FieldLabel htmlFor="share-manual">Complete text for manual copying</FieldLabel><Textarea id="share-manual" readOnly rows={7} value={manual} /></Field>}
      <p role="status">{status}</p>
    </DialogContent>
  </Dialog>;
}
