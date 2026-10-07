import { AlertTriangle, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-ink-faint', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-60 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-subtle', className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
      <span className="flex-1 text-ink">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-medium text-brand hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}
