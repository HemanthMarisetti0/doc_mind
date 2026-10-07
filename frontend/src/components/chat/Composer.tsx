import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/format';

interface Props {
  onSend: (content: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Auto-growing message box. Enter sends, Shift+Enter adds a new line. */
export function Composer({ onSend, disabled, placeholder = 'Ask your documents...', autoFocus }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const content = value.trim();
    if (!content || disabled) return;
    setValue('');
    const ok = await onSend(content);
    if (!ok) setValue(content); // give the text back so nothing is lost on failure
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lg shadow-black/[0.03] transition-colors focus-within:border-brand/50"
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={4000}
        className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-ink-faint"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className={cn(
          'focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          value.trim() && !disabled ? 'bg-brand text-white hover:bg-brand-strong' : 'bg-subtle text-ink-faint',
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </form>
  );
}
