import { FileText, FolderClosed, MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/layout/AppLayout';
import { CollectionDialog } from '@/components/documents/CollectionDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCollections } from '@/hooks/queries';
import { timeAgo } from '@/lib/format';

export function CollectionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error, refetch } = useCollections();

  return (
    <Page>
      <PageHeader
        title="Collections"
        description="Organise documents by topic and chat with a whole collection at once."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New collection
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-black/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <FolderClosed className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold group-hover:text-brand">{collection.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-soft">
                {collection.description || 'No description'}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {collection._count?.documents ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {collection._count?.conversations ?? 0}
                </span>
                <span className="ml-auto">{timeAgo(collection.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderClosed}
          title="No collections yet"
          description="Create collections like “Engineering” or “HR” to keep related documents together."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New collection
            </Button>
          }
        />
      )}

      <CollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Page>
  );
}
