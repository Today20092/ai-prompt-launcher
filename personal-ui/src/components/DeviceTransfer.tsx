import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { exportBackup, planImport, readBackup, templateLabel, type ImportPlan } from '@/lib/backup';
import { beginClipboard, clipboardBrowser, LatestOperation } from '@/lib/browser';
import { receiveTransfer, sendTransfer, transferInvitationLink, parseTransferAddress, watchTransferInvitation } from '@/lib/device-transfer';
import type { Workspace, WorkspaceStore } from '@/lib/workspace';

type Props = { workspace: Workspace; store: WorkspaceStore | null; onImported: (workspace: Workspace) => void };
type Review = { base: Workspace; plan: ImportPlan; complete: () => void };

export default function DeviceTransfer({ workspace, store, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [invitation, setInvitation] = useState('');
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [pairing, setPairing] = useState<{ code: string; complete: () => void } | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const controller = useRef<AbortController | null>(null);
  const copies = useRef(new LatestOperation());
  const latest = useRef({ workspace, store, onImported });
  latest.current = { workspace, store, onImported };
  const stale = review !== null && (review.base !== workspace || store?.data !== review.base);
  const link = invitation ? transferInvitationLink(invitation) : '';

  useEffect(() => {
    let cancelled = false;
    setQr('');
    if (link) void import('qrcode').then(module => module.toString(link, { type: 'svg', margin: 4 })).then(svg => {
      if (!cancelled) setQr(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [link]);

  useEffect(() => {
    const stopWatching = watchTransferInvitation(address => {
      controller.current?.abort(); controller.current = null;
      setBusy(false); setPairing(null); setReview(null); setInvitation(''); setError(''); setStatus('');
      setAddress(address ?? ''); setOpen(true);
      if (address === null) setError('This device invitation is invalid. Ask for a new link.');
    });
    return () => { stopWatching(); controller.current?.abort(); copies.current.cancel(); };
  }, []);

  function stop() {
    controller.current?.abort(); controller.current = null;
    copies.current.cancel();
    setBusy(false); setPairing(null); setReview(null); setInvitation('');
  }

  function changeOpen(next: boolean) {
    stop(); setOpen(next); setStatus(''); setError('');
  }

  async function start(receiving: boolean) {
    if (controller.current) return;
    const attempt = new AbortController(); controller.current = attempt;
    const active = () => controller.current === attempt && !attempt.signal.aborted;
    setBusy(true); setStatus('Connecting…'); setError(''); setReview(null); setPairing(null);
    const options = {
      signal: attempt.signal,
      onStatus: (message: string) => { if (active()) setStatus(message); },
      onPaired: (code: string) => new Promise<void>((resolve, reject) => {
        if (!active()) { reject(new DOMException('Cancelled', 'AbortError')); return; }
        attempt.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true });
        setInvitation('');
        setPairing({ code, complete: () => { if (active()) { setPairing(null); resolve(); } } });
      }),
    };
    try {
      if (receiving) {
        await receiveTransfer({ ...options,
          onInvitation: (value: string) => { if (active()) setInvitation(value); },
          onBackup: async (raw: string) => {
            if (!active()) throw new DOMException('Cancelled', 'AbortError');
            const current = latest.current;
            const plan = planImport(current.workspace, readBackup(raw), false);
            await new Promise<void>((resolve, reject) => {
              attempt.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true });
              setReview({ base: current.workspace, plan, complete: resolve });
            });
          },
        });
      } else {
        const destination = parseTransferAddress(address);
        await sendTransfer(destination, exportBackup(latest.current.workspace), options);
      }
      if (active()) setStatus(receiving ? 'Transfer complete. Your library is saved on this device.' : 'Transfer complete. The other device confirmed its import.');
    } catch {
      if (active()) setError('The transfer could not finish. Your existing prompts are kept. Try a new invitation, reload this page, or use a JSON backup. If you already applied the import, it remains saved.');
    } finally {
      if (active()) { controller.current = null; setBusy(false); setPairing(null); setReview(null); setInvitation(''); }
    }
  }

  function apply() {
    const current = latest.current;
    if (!review || !current.store || review.base !== current.workspace || current.store.data !== review.base) return;
    if (!current.store.importWorkspace(review.plan.next)) { setError(current.store.message); return; }
    const complete = review.complete;
    setReview(null); setError('');
    current.onImported(current.store.data);
    complete();
  }

  async function copyInvitation() {
    const current = controller.current;
    const outcome = await copies.current.run(beginClipboard(clipboardBrowser(), link));
    if (controller.current === current && current && !current.signal.aborted) {
      setStatus(outcome._tag === 'Success' ? 'Invitation copied. Share it only with your other device.' : 'Copying is unavailable. Select and copy the invitation link.');
    }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger render={<Button variant="outline" aria-label="Transfer between devices" />}><ArrowLeftRight data-icon="inline-start" />Transfer</DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Transfer between devices</DialogTitle><DialogDescription>Copy your saved library once, without an account. Both devices must stay open. Pasted input is excluded.</DialogDescription></DialogHeader>
      <DialogPanel className="flex flex-col gap-4">
        <p className="muted">Encrypted transfers use tailcat’s free, rate-limited relays. The receiving device reviews the merge; existing prompts and app preferences are kept. For libraries over 4 MiB, use a JSON backup.</p>
        {!busy && <>
          <Button variant="outline" disabled={!store} onClick={() => void start(true)}>Receive library</Button>
          <Field>
            <FieldLabel htmlFor="transfer-address">Receiver invitation link or address</FieldLabel>
            <Input id="transfer-address" value={address} onChange={event => setAddress(event.target.value)} autoComplete="off" spellCheck={false} />
            <FieldDescription>On your other device, choose Receive library, then paste its invitation here.</FieldDescription>
          </Field>
          <Button disabled={!address.trim()} onClick={() => void start(false)}>Send saved library</Button>
        </>}
        {invitation && <Field>
          {qr && <img src={qr} alt="Scan invitation on the sending device" width={240} height={240} className="max-w-full self-center" />}
          <FieldLabel htmlFor="transfer-invitation">Single-use invitation link</FieldLabel>
          <Input id="transfer-invitation" readOnly value={link} onFocus={event => event.target.select()} />
          <FieldDescription>Open this link on the sending device. Keep it private; it expires when this session ends.</FieldDescription>
          <Button variant="outline" onClick={() => void copyInvitation()}>Copy invitation</Button>
        </Field>}
        {pairing && <div className="flex flex-col gap-3">
          <p>Check that both devices show this exact code:</p>
          <strong className="text-center" aria-label={`Pairing code ${pairing.code}`}>{pairing.code}</strong>
          <p>Only continue if you recognize the other device and the codes match.</p>
          <Button onClick={pairing.complete}>Codes match</Button>
        </div>}
        {review && <div className="flex flex-col gap-2">
          <p>{review.plan.added.length} prompts to add. {review.plan.skipped} identical prompts to skip. {review.plan.favoritesAdded} favorites to add.</p>
          {review.plan.added.length > 0 && <ul aria-label="Prompts to transfer" className="max-h-40 overflow-y-auto list-disc pl-5">
            {review.plan.added.map(item => <li className="wrap-anywhere" key={item.id}>{templateLabel(item, review.plan.next.templates)}</li>)}
          </ul>}
          {(review.plan.archivedAdded > 0 || review.plan.archivedSkipped > 0) && <p>{review.plan.archivedAdded} archived presets to add. Preset controls remain unavailable.</p>}
          <p>Keep this device’s preferred app and current prompt.</p>
          {stale && <Alert variant="error"><AlertDescription>Your workspace changed during review. Cancel and start a new transfer to review a fresh merge.</AlertDescription></Alert>}
          <Button disabled={stale || !store} onClick={apply}>Apply transfer</Button>
        </div>}
        {error && <Alert variant="error"><AlertDescription>{error}</AlertDescription></Alert>}
        <p role="status" className="empty:sr-only">{status}</p>
      </DialogPanel>
      <DialogFooter><Button variant="outline" onClick={() => changeOpen(false)}>{busy ? 'Cancel transfer' : 'Close'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
