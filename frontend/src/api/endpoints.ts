import { api } from './client';
import type {
  AuthResponse,
  ChatScope,
  Collection,
  CollectionDetail,
  Conversation,
  ConversationDetail,
  DocumentDetail,
  DocumentItem,
  SendMessageResponse,
  Stats,
  User,
} from './types';

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body }),
  register: (body: { name: string; email: string; password: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body }),
  me: () => api<User>('/auth/me'),
  providers: () => api<{ google: boolean }>('/auth/providers'),
};

export const usersApi = {
  update: (body: { name?: string }) => api<User>('/users/me', { method: 'PATCH', body }),
  stats: () => api<Stats>('/users/me/stats'),
};

export const documentsApi = {
  list: (params: { collectionId?: string; search?: string } = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return api<DocumentItem[]>(`/documents${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<DocumentDetail>(`/documents/${id}`),
  upload: (file: File, collectionId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (collectionId) form.append('collectionId', collectionId);
    return api<DocumentItem>('/documents', { method: 'POST', body: form });
  },
  update: (id: string, body: { name?: string; collectionId?: string | null }) =>
    api<DocumentItem>(`/documents/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<{ id: string }>(`/documents/${id}`, { method: 'DELETE' }),
  reprocess: (id: string) => api<DocumentItem>(`/documents/${id}/reprocess`, { method: 'POST' }),
  downloadUrl: (id: string) => api<{ url: string }>(`/documents/${id}/download`),
};

export const collectionsApi = {
  list: () => api<Collection[]>('/collections'),
  get: (id: string) => api<CollectionDetail>(`/collections/${id}`),
  create: (body: { name: string; description?: string }) =>
    api<Collection>('/collections', { method: 'POST', body }),
  update: (id: string, body: { name?: string; description?: string }) =>
    api<Collection>(`/collections/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<{ id: string }>(`/collections/${id}`, { method: 'DELETE' }),
};

export const conversationsApi = {
  list: () => api<Conversation[]>('/conversations'),
  get: (id: string) => api<ConversationDetail>(`/conversations/${id}`),
  create: (scope: ChatScope) => api<Conversation>('/conversations', { method: 'POST', body: scope }),
  rename: (id: string, title: string) =>
    api<Conversation>(`/conversations/${id}`, { method: 'PATCH', body: { title } }),
  remove: (id: string) => api<{ id: string }>(`/conversations/${id}`, { method: 'DELETE' }),
  send: (id: string, content: string) =>
    api<SendMessageResponse>(`/conversations/${id}/messages`, { method: 'POST', body: { content } }),
};
