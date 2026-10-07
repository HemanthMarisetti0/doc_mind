import { FileText, MessageSquare, Pencil, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppLayout';
import { CollectionDialog } from '@/components/documents/CollectionDialog';
import { DocumentList } from '@/components/documents/DocumentList';
import { UploadDialog } from '@/components/documents/UploadDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDeleteCollection } from '@/hooks/mutations';
import { useCollection } from '@/hooks/queries';

export function CollectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: collection, isLoading, error, refetch } = useCollection(id);
  const remove = useDeleteCollection();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <PageLoader />;
  if (error || !collection)
    return (
      <Page>
        <ErrorState message={error?.message ?? 'Collection not found'} onRetry={() => refetch()} />
      </Page>
    );

  const hasReady = collection.documents.some((d) => d.status === 'READY');

  return (
    <Page>
      <PageHeader
        eyebrow={
          <Link to="/collections" className="hover:text-brand">
            Collections
          </Link>
        }
        title={collection.name}
        description={collection.description ?? undefined}
        actions={
          <>
            <Button variant="secondary" size="icon" onClick={() => setEditOpen(true)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setConfirmDelete(true)} title="Delete">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            <Button variant="secondary" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
            <Button disabled={!hasReady} onClick={() => navigate(`/chat?collectionId=${collection.id}`)}>
              <MessageSquare className="h-4 w-4" /> Chat
            </Button>
          </>
        }
      />

      {collection.documents.length ? (
        <DocumentList documents={collection.documents} showCollection={false} />
      ) : (
        <EmptyState
          icon={FileText}
          title="This collection is empty"
          description="Upload documents here, or move existing ones in from the Documents page."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" /> Upload document
            </Button>
          }
        />
      )}

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultCollectionId={collection.id}
      />
      <CollectionDialog open={editOpen} onClose={() => setEditOpen(false)} collection={collection} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete collection?"
        description="The documents inside are kept and become unassigned."
        loading={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate(collection.id, { onSuccess: () => navigate('/collections') })}
      />
    </Page>
  );
}
