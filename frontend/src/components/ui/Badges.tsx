import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { DocumentStatus } from '@/api/types';
import { cn, fileKind } from '@/lib/format';

const STATUS: Record<DocumentStatus, { label: string; className: string; icon: typeof Clock }> = {
  UPLOADED: { label: 'Queued', className: 'bg-subtle text-ink-soft', icon: Clock },
  PROCESSING: { label: 'Processing', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: Loader2 },
  READY: { label: 'Ready', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  FAILED: { label: 'Failed', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      <Icon className={cn('h-3 w-3', status === 'PROCESSING' && 'animate-spin')} />
      {label}
    </span>
  );
}

const KIND_STYLE = {
  pdf: 'bg-red-500/10 text-red-600 dark:text-red-400',
  docx: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  txt: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
};

/** A compact file-type tile used in document lists. */
export function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const kind = fileKind(mimeType);
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-semibold uppercase',
        KIND_STYLE[kind],
        className,
      )}
    >
      {kind}
    </div>
  );
}
