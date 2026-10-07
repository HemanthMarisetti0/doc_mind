import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { collectionsApi, conversationsApi, documentsApi } from '@/api/endpoints';

/** Invalidate everything a document change can affect (lists, counts, collections). */
function useInvalidateLibrary() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['documents'] }),
      qc.invalidateQueries({ queryKey: ['document'] }),
      qc.invalidateQueries({ queryKey: ['collections'] }),
      qc.invalidateQueries({ queryKey: ['collection'] }),
      qc.invalidateQueries({ queryKey: ['stats'] }),
    ]);
}

const onError = (err: Error) => toast.error(err.message);

export function useUploadDocument() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ file, collectionId }: { file: File; collectionId?: string }) =>
      documentsApi.upload(file, collectionId),
    onSuccess: invalidate,
  });
}

export function useUpdateDocument() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; collectionId?: string | null }) =>
      documentsApi.update(id, body),
    onSuccess: () => {
      toast.success('Document updated');
      return invalidate();
    },
    onError,
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => {
      toast.success('Document deleted');
      return invalidate();
    },
    onError,
  });
}

export function useReprocessDocument() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: documentsApi.reprocess,
    onSuccess: () => {
      toast.success('Processing restarted');
      return invalidate();
    },
    onError,
  });
}

export function useCreateCollection() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: collectionsApi.create,
    onSuccess: () => {
      toast.success('Collection created');
      return invalidate();
    },
    onError,
  });
}

export function useUpdateCollection() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; description?: string }) =>
      collectionsApi.update(id, body),
    onSuccess: () => {
      toast.success('Collection updated');
      return invalidate();
    },
    onError,
  });
}

export function useDeleteCollection() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: collectionsApi.remove,
    onSuccess: () => {
      toast.success('Collection deleted');
      return invalidate();
    },
    onError,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conversationsApi.remove,
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['conversation', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Conversation deleted');
    },
    onError,
  });
}
