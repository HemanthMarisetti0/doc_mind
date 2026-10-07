import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

const control =
  'focus-ring w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-brand/60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(control, 'h-10', className)} {...rest} />
  ),
);
Input.displayName = 'Input';

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-20 py-2', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'h-10 pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
