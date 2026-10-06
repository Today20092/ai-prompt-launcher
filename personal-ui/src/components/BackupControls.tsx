import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { exportBackup, planImport, readBackup, templateLabel, type ImportPlan } from '@/lib/backup';
import { downloadText, readFile, LatestOperation } from '@/lib/browser';
import { runBoundarySync } from '@/lib/boundary';
import type { Workspace, WorkspaceStore } from '@/lib/workspace';

type Props = { workspace: Workspace; store: WorkspaceStore | null; onImported: (workspace: Workspace) => void };

export default function BackupControls({ workspace, store, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [review, setReview] = useState<{ base: Workspace; plan: ImportPlan } | null>(null);
  const generation = useRef(0);
  const operations = useRef(new LatestOperation());
  useEffect(() => () => { generation.current++; operations.current.cancel(); }, []);
  useEffect(() => { generation.current++; operations.current.cancel(); setReading(false); }, [workspace]);
  const latest = useRef({ workspace, store });
  latest.current = { workspace, store };
  const stale = review !== null && review.base !== workspace;

  function changeOpen(next: boolean) {
    generation.current++; operations.current.cancel();
    setOpen(next);
    setReview(null);
    setReading(false);
    setError('');
  }

  function download() {
    try {
      const outcome = runBoundarySync(downloadText(exportBackup(workspace), `promptroom-backup-${new Date().toISOString().slice(0, 10)}.json`));
      if (outcome._tag !== 'Success') throw new Error('Download failed');
      setStatus('Backup download requested. Keep the JSON file somewhere safe.');
    } catch {
      setStatus('The backup could not be downloaded. Your workspace is unchanged. Try again.');
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const attempt = ++generation.current;
    setReview(null);
    setError('');
    if (!file) { operations.current.cancel(); setReading(false); return; }
    setReading(true);
    try {
      const outcome = await operations.current.run(readFile(file));
      if (outcome._tag === 'Cancelled') return;
      if (outcome._tag !== 'Success') throw new Error('File read failed');
      const incoming = readBackup(outcome.value);
      if (attempt !== generation.current) return;
      const current = latest.current;
      setReview({ base: current.workspace, plan: planImport(current.workspace, incoming, current.store?.canRestorePreferences) });
    } catch {
      if (attempt !== generation.current) return;
      setError('This file is not a valid Promptroom version 1 backup. Nothing has changed.');
    } finally {
      if (attempt === generation.current) setReading(false);
    }
  }

  function applyImport() {
    if (!review || !store || stale || store.data !== review.base) return;
    if (!store.importWorkspace(review.plan.next)) {
      setError(store.message);
      return;
    }
    onImported(store.data);
    setStatus(`Backup imported. Added ${review.plan.added.length} prompts; skipped ${review.plan.skipped} identical prompts.`);
    changeOpen(false);
  }

  return <>
    <Separator />
    <section aria-labelledby="backup-heading" className="flex flex-col gap-3">
      <h2 id="backup-heading">Backups</h2>
      <p className="muted">Transfer your saved prompts, favorites and app settings between browsers. Pasted input is excluded. Any older archived presets are preserved.</p>
      <div className="backup-actions">
        <Button variant="outline" onClick={download}><Download data-icon="inline-start" />Export backup</Button>
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogTrigger asChild><Button variant="outline"><Upload data-icon="inline-start" />Import backup</Button></DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <DialogHeader><DialogTitle>Import backup</DialogTitle><DialogDescription>Review the merge before applying it. Existing prompts are kept, and identical prompts are skipped.</DialogDescription></DialogHeader>
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="backup-file">JSON backup</FieldLabel>
                <Input id="backup-file" type="file" accept=".json,application/json" aria-invalid={Boolean(error)} aria-describedby={error ? 'backup-file-help backup-error' : 'backup-file-help'} onChange={chooseFile} />
                <FieldDescription id="backup-file-help">Choose a Promptroom version 1 backup. It is read in this browser.</FieldDescription>
                {error && <FieldError id="backup-error" role="alert">{error}</FieldError>}
              </Field>
            </FieldGroup>
            {reading && <p role="status">Reading and validating backup...</p>}
            {stale && <p role="alert">Your workspace changed during review. Choose the file again to review a fresh merge.</p>}
            {review && !stale && <div className="flex flex-col gap-2" aria-live="polite">
              <p>{review.plan.added.length} prompts to add. {review.plan.skipped} identical prompts to skip. {review.plan.favoritesAdded} favorites to add.</p>
              {review.plan.added.length > 0 && <ul aria-label="Prompts to add" className="max-h-40 overflow-y-auto list-disc pl-5">
                {review.plan.added.map(item => <li className="wrap-anywhere" key={item.id}>{templateLabel(item, review.plan.next.templates)}</li>)}
              </ul>}
              {(review.plan.archivedAdded > 0 || review.plan.archivedSkipped > 0) && <p>{review.plan.archivedAdded} archived presets to add. {review.plan.archivedSkipped} identical archived presets to skip. Preset controls remain unavailable.</p>}
              <p>{review.plan.restorePreferences ? `This browser has a fresh workspace. Restore preferred app ${review.plan.next.preferredApp} and the last-used prompt from the backup.` : 'Keep this browser’s preferred app and current prompt.'}</p>
            </div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => changeOpen(false)}>Cancel</Button>
              <Button disabled={!review || stale || reading || !store} onClick={applyImport}>Apply import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {status && <p role="status">{status}</p>}
    </section>
  </>;
}
