import { AlertTriangle, Download, FolderInput, MessageSquare, RotateCw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { documentsApi } from '@/api/endpoints';
import { Page } from '@/components/layout/AppLayout';
import { MoveDialog } from '@/components/documents/DocumentList';
import { FileIcon, StatusBadge } from '@/components/ui/Badges';
import { Button } from '@/components/ui/Button';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useDeleteDocument, useReprocessDocument } from '@/hooks/mutations';
import { useDocument } from '@/hooks/queries';
import { formatBytes, timeAgo } from '@/lib/format';

export function DocumentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: doc, isLoading, error, refetch } = useDocument(id);
  const remove = useDeleteDocument();
  const reprocess = useReprocessDocument();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moving, setMoving] = useState(false);

  if (isLoading) return <PageLoader />;
  if (error || !doc)
    return (
      <Page>
        <ErrorState message={error?.message ?? 'Document not found'} onRetry={() => refetch()} />
      </Page>
    );

  async function download() {
    try {
      const { url } = await documentsApi.downloadUrl(id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const processing = doc.status === 'UPLOADED' || doc.status === 'PROCESSING';

  return (
    <Page>
      <nav className="mb-6 text-sm text-ink-faint">
        <Link to="/documents" className="hover:text-brand">
          Documents
        </Link>
        {doc.collection && (
          <>
            {' / '}
            <Link to={`/collections/${doc.collection.id}`} className="hover:text-brand">
              {doc.collection.name}
            </Link>
          </>
        )}
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <FileIcon mimeType={doc.mimeType} className="h-14 w-14 text-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{doc.name}</h1>
            <StatusBadge status={doc.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">{doc.originalFileName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={doc.status !== 'READY'}
            onClick={() => navigate(`/chat?documentId=${doc.id}`)}
          >
            <MessageSquare className="h-4 w-4" /> Chat
          </Button>
          <Button variant="secondary" size="icon" onClick={download} title="Download original">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setMoving(true)} title="Move to collection">
            <FolderInput className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={processing}
            onClick={() => reprocess.mutate(doc.id)}
            title="Reprocess"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setConfirmDelete(true)} title="Delete">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {doc.status === 'FAILED' && (
        <div className="mt-6 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <div className="font-medium">Processing failed</div>
            <div className="text-ink-soft">{doc.errorMessage ?? 'Unknown error'}</div>
          </div>
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Meta label="Size">{formatBytes(doc.fileSize)}</Meta>
        <Meta label="Pages">{doc.pageCount ?? '—'}</Meta>
        <Meta label="Chunks indexed">{doc._count?.chunks ?? 0}</Meta>
        <Meta label="Uploaded">{timeAgo(doc.createdAt)}</Meta>
      </dl>

      <section className="mt-10">
        <h2 className="font-semibold">Extracted chunks</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The text DocMind split from this file and embedded for semantic search
          {doc._count && doc._count.chunks > doc.chunks.length && ` (first ${doc.chunks.length} shown)`}.
        </p>
        {processing ? (
          <div className="mt-4 rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-soft">
            Extracting text and generating embeddings…
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {doc.chunks.map((chunk) => (
              <article key={chunk.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-2 flex gap-2 font-mono text-[11px] text-ink-faint">
                  <span>#{chunk.chunkIndex + 1}</span>
                  {chunk.pageNumber && <span>· page {chunk.pageNumber}</span>}
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-ink-soft">{chunk.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete document?"
        description={`"${doc.name}" and its embeddings will be permanently removed.`}
        loading={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(doc.id, { onSuccess: () => navigate('/documents') })}
      />
      <MoveDialog doc={doc} open={moving} onClose={() => setMoving(false)} />
    </Page>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
