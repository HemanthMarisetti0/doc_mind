import { FolderInput, MessageSquare, MoreHorizontal, RotateCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { DocumentItem } from '@/api/types';
import { FileIcon, StatusBadge } from '@/components/ui/Badges';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useDeleteDocument, useReprocessDocument, useUpdateDocument } from '@/hooks/mutations';
import { useCollections } from '@/hooks/queries';
import { formatBytes, timeAgo } from '@/lib/format';

export function DocumentList({ documents, showCollection = true }: { documents: DocumentItem[]; showCollection?: boolean }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {documents.map((doc) => (
        <DocumentRow key={doc.id} doc={doc} showCollection={showCollection} />
      ))}
    </div>
  );
}

function DocumentRow({ doc, showCollection }: { doc: DocumentItem; showCollection: boolean }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const remove = useDeleteDocument();
  const reprocess = useReprocessDocument();

  return (
    <div className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-subtle/60">
      <FileIcon mimeType={doc.mimeType} />
      <div className="min-w-0 flex-1">
        <Link to={`/documents/${doc.id}`} className="block truncate font-medium hover:text-brand">
          {doc.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
          <span>{formatBytes(doc.fileSize)}</span>
          {doc.pageCount && <span>· {doc.pageCount} pages</span>}
          <span>· {timeAgo(doc.createdAt)}</span>
          {showCollection && doc.collection && (
            <Link to={`/collections/${doc.collection.id}`} className="hover:text-brand">
              · {doc.collection.name}
            </Link>
          )}
        </div>
      </div>
      <StatusBadge status={doc.status} />
      <RowMenu
        items={[
          {
            label: 'Chat with document',
            icon: MessageSquare,
            disabled: doc.status !== 'READY',
            onClick: () => navigate(`/chat?documentId=${doc.id}`),
          },
          { label: 'Move to collection', icon: FolderInput, onClick: () => setMoving(true) },
          ...(doc.status === 'FAILED' || doc.status === 'READY'
            ? [{ label: 'Reprocess', icon: RotateCw, onClick: () => reprocess.mutate(doc.id) }]
            : []),
          { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirmDelete(true) },
        ]}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete document?"
        description={`"${doc.name}" and its embeddings will be permanently removed.`}
        loading={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(doc.id, { onSuccess: () => setConfirmDelete(false) })}
      />
      <MoveDialog doc={doc} open={moving} onClose={() => setMoving(false)} />
    </div>
  );
}

export function MoveDialog({ doc, open, onClose }: { doc: DocumentItem; open: boolean; onClose: () => void }) {
  const { data: collections } = useCollections();
  const update = useUpdateDocument();
  const [collectionId, setCollectionId] = useState(doc.collectionId ?? '');
  useEffect(() => {
    if (open) setCollectionId(doc.collectionId ?? '');
  }, [open, doc.collectionId]);

  return (
    <Modal open={open} onClose={onClose} title="Move to collection" description={doc.name}>
      <Field label="Collection">
        <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
          <option value="">No collection</option>
          {collections?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={update.isPending}
          onClick={() =>
            update.mutate({ id: doc.id, collectionId: collectionId || null }, { onSuccess: onClose })
          }
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}

interface MenuItem {
  label: string;
  icon: typeof Trash2;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-subtle disabled:opacity-40 ${
                item.danger ? 'text-red-600 dark:text-red-400' : 'text-ink'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
