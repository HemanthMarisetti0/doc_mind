import { useQuery } from '@tanstack/react-query';
import { collectionsApi, conversationsApi, documentsApi, usersApi } from '@/api/endpoints';
import type { DocumentItem } from '@/api/types';

export const keys = {
  stats: ['stats'] as const,
  documents: (params?: object) => ['documents', params ?? {}] as const,
  document: (id: string) => ['document', id] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
};

const isPending = (d: Pick<DocumentItem, 'status'>) =>
  d.status === 'UPLOADED' || d.status === 'PROCESSING';

/** Poll while any document is still being processed so status badges update live. */
const pollWhileProcessing = (docs?: Pick<DocumentItem, 'status'>[]) =>
  docs?.some(isPending) ? 2500 : false;

export function useStats() {
  return useQuery({ queryKey: keys.stats, queryFn: usersApi.stats });
}

export function useDocuments(params: { collectionId?: string; search?: string } = {}) {
  return useQuery({
    queryKey: keys.documents(params),
    queryFn: () => documentsApi.list(params),
    refetchInterval: (q) => pollWhileProcessing(q.state.data),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: keys.document(id),
    queryFn: () => documentsApi.get(id),
    refetchInterval: (q) => (q.state.data && isPending(q.state.data) ? 2500 : false),
  });
}

export function useCollections() {
  return useQuery({ queryKey: keys.collections, queryFn: collectionsApi.list });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: keys.collection(id),
    queryFn: () => collectionsApi.get(id),
    refetchInterval: (q) => pollWhileProcessing(q.state.data?.documents),
  });
}

export function useConversations() {
  return useQuery({ queryKey: keys.conversations, queryFn: conversationsApi.list });
}

export function useConversation(id?: string) {
  return useQuery({
    queryKey: keys.conversation(id ?? ''),
    queryFn: () => conversationsApi.get(id!),
    enabled: Boolean(id),
  });
}
