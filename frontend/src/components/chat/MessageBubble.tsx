import { ChevronDown, FileText, Sparkles } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import type { Message, Source } from '@/api/types';
import { cn } from '@/lib/format';

/** Turn the model's [1] / [2, 3] markers into links the renderer shows as citation chips. */
function linkCitations(text: string) {
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g, (_, nums: string) =>
    nums
      .split(',')
      .map((n) => `[${n.trim()}](#cite-${n.trim()})`)
      .join(''),
  );
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] text-white">
          {message.content}
        </div>
      </div>
    );
  }
  return <AssistantMessage message={message} />;
}

function AssistantMessage({ message }: { message: Message }) {
  const sources = message.sources ?? [];
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-ink dark:prose-invert prose-headings:text-ink prose-strong:text-ink prose-code:before:content-none prose-code:after:content-none prose-pre:bg-subtle prose-pre:text-ink">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith('#cite-')) {
                  const n = Number(href.slice(6));
                  const source = sources.find((s) => s.index === n);
                  if (!source) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => setActive(active === n ? null : n)}
                      title={`${source.documentName}${source.pageNumber ? ` · page ${source.pageNumber}` : ''}`}
                      className="mx-0.5 inline-flex h-[18px] min-w-[18px] -translate-y-px items-center justify-center rounded-md bg-brand-soft px-1 align-middle text-[11px] font-semibold text-brand-ink no-underline hover:bg-brand hover:text-white"
                    >
                      {n}
                    </button>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {linkCitations(message.content)}
          </ReactMarkdown>
        </div>

        {sources.length > 0 && <SourceList sources={sources} active={active} onToggle={setActive} />}
      </div>
    </div>
  );
}

/** One card per cited passage, grouped visually by document and page. */
function SourceList({
  sources,
  active,
  onToggle,
}: {
  sources: Source[];
  active: number | null;
  onToggle: (n: number | null) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Sources</div>
      <div className="flex flex-col gap-2">
        {sources.map((source) => {
          const open = active === source.index;
          return (
            <div
              key={source.index}
              className={cn(
                'rounded-xl border bg-surface transition-colors',
                open ? 'border-brand/50' : 'border-line',
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(open ? null : source.index)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm"
              >
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-brand-soft px-1 text-[11px] font-semibold text-brand-ink">
                  {source.index}
                </span>
                <FileText className="h-4 w-4 shrink-0 text-ink-faint" />
                <span className="min-w-0 flex-1 truncate font-medium">{source.documentName}</span>
                {source.pageNumber && (
                  <span className="shrink-0 text-xs text-ink-faint">Page {source.pageNumber}</span>
                )}
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-ink-faint transition-transform', open && 'rotate-180')}
                />
              </button>
              {open && (
                <div className="border-t border-line px-3 py-2.5 text-sm">
                  <p className="leading-relaxed text-ink-soft">“{source.snippet}…”</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
                    <span>Relevance {Math.round(source.similarity * 100)}%</span>
                    <Link to={`/documents/${source.documentId}`} className="font-medium text-brand hover:underline">
                      Open document
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-2 pt-1.5 text-sm text-ink-soft">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot h-1.5 w-1.5 rounded-full bg-brand"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        Searching your documents…
      </div>
    </div>
  );
}
