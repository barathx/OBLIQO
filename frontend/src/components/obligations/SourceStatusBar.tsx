import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useObliqo } from '@/hooks/use-obliqo';
import { api, getSnapshot, SCAN_STEPS } from '@/services/api';
import { sourceStatus } from '@/data/mockData';
import { SourceBadge, ProgressBar, money, shortDate, daysLeft } from './shared';

type Phase = 'idle' | 'scanning' | 'done' | 'error';

export function SourceStatusBar() {
  const { lastScan } = useObliqo();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState(0);
  const [found, setFound] = useState(0);

  const scan = async () => {
    setPhase('scanning'); setStep(0);
    try {
      const result = await api.scanSources(setStep);
      setFound(result.detected);
      setStep(SCAN_STEPS.length);
      setPhase('done');
      setTimeout(() => {
        setPhase('idle');
        if (!result.detected) { toast('No new obligations', { description: 'Your workspace is up to date.' }); return; }
        const snapshot = getSnapshot().obligations.filter((o: { id: string }) => result.obligationIds.includes(o.id));
        toast.success(`${result.detected} new ${result.detected === 1 ? 'obligation' : 'obligations'} detected`, {
          description: <ul className="mt-1 space-y-1.5">{snapshot.map(o => <li key={o.id}><span className="font-medium text-foreground">{o.title}</span><br /><span className="text-muted-foreground">{daysLeft(o.dueDate) === 0 ? 'Due today' : `Due ${shortDate(o.dueDate)}`} · {money(o.amount)}</span></li>)}</ul>,
          action: { label: 'Review obligations', onClick: () => navigate({ to: '/obligations' }) },
          duration: 9000,
        });
      }, 900);
    } catch {
      setPhase('error');
    }
  };

  const progress = phase === 'done' ? 100 : (step / SCAN_STEPS.length) * 100 + 8;

  return (
    <section aria-label="Connected sources" className="mt-5 flex flex-col gap-3 border-y border-border py-3 text-xs lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Connected sources</span>
        {sourceStatus.map(s => (
          <span key={s.source} className="inline-flex items-center gap-1.5">
            <SourceBadge source={s.source} />
            {s.status === 'Connected'
              ? <span className="inline-flex items-center gap-0.5 text-success"><Check size={12} aria-hidden="true" />Connected</span>
              : <span className="text-muted-foreground/70">Coming soon</span>}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 lg:justify-end">
        <p className="text-muted-foreground">Last scan · {lastScan.scannedAt}<span className="hidden sm:inline"> · {lastScan.detected} new {lastScan.detected === 1 ? 'obligation' : 'obligations'} detected</span></p>
        <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={scan} disabled={phase === 'scanning' || phase === 'done'}>
          <RefreshCw size={14} aria-hidden="true" /> Scan now
        </Button>
      </div>

      <Dialog open={phase !== 'idle'} onOpenChange={o => { if (!o && phase !== 'scanning') setPhase('idle'); }}>
        <DialogContent className="max-w-sm rounded-lg" onInteractOutside={e => { if (phase === 'scanning') e.preventDefault(); }}>
          {phase === 'error' ? (
            <>
              <DialogHeader>
                <AlertCircle className="text-muted-foreground" aria-hidden="true" />
                <DialogTitle>Couldn't scan your connected sources.</DialogTitle>
                <DialogDescription>Please try again.</DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex justify-end gap-2"><Button variant="outline" onClick={() => setPhase('idle')}>Close</Button><Button onClick={scan}>Try again</Button></div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{phase === 'done' ? `${found} new ${found === 1 ? 'obligation' : 'obligations'} detected` : 'Scanning your sources'}</DialogTitle>
                <DialogDescription>{phase === 'done' ? 'Your workspace has been updated.' : 'This usually takes a few seconds.'}</DialogDescription>
              </DialogHeader>
              <ProgressBar value={progress} />
              <ol className="mt-2 space-y-2.5 text-sm" aria-live="polite">
                {SCAN_STEPS.map((label, i) => {
                  const state = i < step || phase === 'done' ? 'done' : i === step ? 'active' : 'waiting';
                  return (
                    <li key={label} className={`flex items-center gap-2.5 transition-colors ${state === 'waiting' ? 'text-muted-foreground/60' : state === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${state === 'done' ? 'border-teal bg-teal text-primary-foreground' : state === 'active' ? 'border-teal animate-pulse' : 'border-border'}`}>
                        {state === 'done' && <Check size={10} aria-hidden="true" />}
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
