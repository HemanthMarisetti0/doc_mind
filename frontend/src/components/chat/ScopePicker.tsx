import { FileText, FolderClosed, Library } from 'lucide-react';
import type { ChatScope } from '@/api/types';
import { Select } from '@/components/ui/Field';
import { useCollections, useDocuments } from '@/hooks/queries';
import { cn } from '@/lib/format';

type Mode = 'all' | 'collection' | 'document';

const MODES: { value: Mode; label: string; icon: typeof Library }[] = [
  { value: 'all', label: 'All documents', icon: Library },
  { value: 'collection', label: 'Collection', icon: FolderClosed },
  { value: 'document', label: 'Document', icon: FileText },
];

export function scopeMode(scope: ChatScope): Mode {
  return scope.documentId !== undefined ? 'document' : scope.collectionId !== undefined ? 'collection' : 'all';
}

/** Choose what a new conversation can search: everything, one collection or one document. */
export function ScopePicker({ scope, onChange }: { scope: ChatScope; onChange: (s: ChatScope) => void }) {
  const mode = scopeMode(scope);
  const { data: collections } = useCollections();
  const { data: documents } = useDocuments();
  const readyDocs = documents?.filter((d) => d.status === 'READY') ?? [];

  function setMode(next: Mode) {
    if (next === 'all') onChange({});
    if (next === 'collection') onChange({ collectionId: collections?.[0]?.id ?? '' });
    if (next === 'document') onChange({ documentId: readyDocs[0]?.id ?? '' });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex rounded-xl border border-line bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              mode === m.value ? 'bg-brand-soft text-brand-ink' : 'text-ink-soft hover:text-ink',
            )}
          >
            <m.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {mode === 'collection' && (
        <Select
          className="w-72"
          value={scope.collectionId}
          onChange={(e) => onChange({ collectionId: e.target.value })}
        >
          {!collections?.length && <option value="">No collections yet</option>}
          {collections?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c._count?.documents ?? 0})
            </option>
          ))}
        </Select>
      )}
      {mode === 'document' && (
        <Select
          className="w-72"
          value={scope.documentId}
          onChange={(e) => onChange({ documentId: e.target.value })}
        >
          {!readyDocs.length && <option value="">No ready documents</option>}
          {readyDocs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
