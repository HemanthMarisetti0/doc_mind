import { FileText, Search, Upload } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Page } from '@/components/layout/AppLayout';
import { DocumentList } from '@/components/documents/DocumentList';
import { UploadDialog } from '@/components/documents/UploadDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCollections, useDocuments } from '@/hooks/queries';

export function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const { data: collections } = useCollections();
  const documents = useDocuments({ search: deferredSearch, collectionId });
  const filtered = Boolean(deferredSearch || collectionId);

  return (
    <Page>
      <PageHeader
        title="Documents"
        description="Everything you've uploaded. Ready documents can be searched and chatted with."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="pl-9"
          />
        </div>
        <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="sm:w-56">
          <option value="">All collections</option>
          {collections?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {documents.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : documents.error ? (
        <ErrorState message={documents.error.message} onRetry={() => documents.refetch()} />
      ) : documents.data?.length ? (
        <DocumentList documents={documents.data} />
      ) : (
        <EmptyState
          icon={FileText}
          title={filtered ? 'No matching documents' : 'No documents yet'}
          description={
            filtered
              ? 'Try a different name or collection.'
              : 'Upload a PDF, Word document or text file to get started.'
          }
          action={
            !filtered && (
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" /> Upload document
              </Button>
            )
          }
        />
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </Page>
  );
}
