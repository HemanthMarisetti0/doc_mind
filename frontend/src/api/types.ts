export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Ref {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number; conversations: number };
}

export interface DocumentItem {
  id: string;
  name: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  errorMessage: string | null;
  pageCount: number | null;
  collectionId: string | null;
  collection?: Ref | null;
  createdAt: string;
  updatedAt: string;
  _count?: { chunks: number };
}

export interface DocumentChunkPreview {
  id: string;
  chunkIndex: number;
  pageNumber: number | null;
  content: string;
}

export interface DocumentDetail extends DocumentItem {
  chunks: DocumentChunkPreview[];
}

export interface CollectionDetail extends Collection {
  documents: DocumentItem[];
}

export interface Source {
  index: number;
  documentId: string;
  documentName: string;
  pageNumber: number | null;
  chunkIndex: number;
  snippet: string;
  similarity: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: Source[] | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  collectionId: string | null;
  documentId: string | null;
  collection: Ref | null;
  document: Ref | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  toolCalls: { name: string; args: Record<string, unknown> }[];
}

export interface Stats {
  documents: number;
  collections: number;
  conversations: number;
  readyDocuments: number;
  chunks: number;
}

export interface ChatScope {
  collectionId?: string;
  documentId?: string;
}
