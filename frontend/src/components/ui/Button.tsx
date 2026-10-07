import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong shadow-sm shadow-brand/20',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle',
  ghost: 'text-ink-soft hover:bg-subtle hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
