import { cn } from '@/lib/format';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path
          d="M10 8h7a7 7 0 0 1 0 14h-7z"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="23.5" r="2.5" fill="#c7d2fe" />
      </svg>
      {withText && <span className="text-[17px] font-semibold tracking-tight">DocMind</span>}
    </div>
  );
}
