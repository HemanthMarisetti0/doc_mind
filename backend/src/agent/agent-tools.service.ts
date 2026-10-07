import { FunctionDeclaration } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SourceCitation } from '../common/sources';
import { toCitation } from '../rag/rag.service';
import { ChunkMatch, SearchScope, VectorSearchService } from '../vector-search/vector-search.service';

/** Per-request state shared by tool calls: who is asking, and which sources were surfaced. */
export interface AgentRunContext {
  userId: string;
  scope: SearchScope;
  sources: SourceCitation[];
}

export const AGENT_TOOLS: FunctionDeclaration[] = [
  {
    name: 'search_documents',
    description:
      "Semantic search over the user's documents available in this conversation. Returns numbered passages.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for, phrased as a question or keywords.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_collection',
    description:
      'Semantic search restricted to one of the user\'s collections, found by name. Returns numbered passages.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        collection_name: { type: 'string', description: 'Name of the collection, e.g. "HR".' },
        query: { type: 'string', description: 'What to search for.' },
      },
      required: ['collection_name', 'query'],
    },
  },
  {
    name: 'get_document',
    description:
      'Look up one document by (partial) name: status, page count, collection and its opening text.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        document_name: { type: 'string', description: 'Full or partial document name.' },
      },
      required: ['document_name'],
    },
  },
];

@Injectable()
export class AgentToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

  async execute(name: string, args: Record<string, unknown>, ctx: AgentRunContext) {
    switch (name) {
      case 'search_documents':
        return this.searchDocuments(String(args.query ?? ''), ctx);
      case 'search_collection':
        return this.searchCollection(String(args.collection_name ?? ''), String(args.query ?? ''), ctx);
      case 'get_document':
        return this.getDocument(String(args.document_name ?? ''), ctx);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private async searchDocuments(query: string, ctx: AgentRunContext) {
    const matches = await this.vectorSearch.search(ctx.userId, query, ctx.scope);
    return this.toPassages(matches, ctx);
  }

  private async searchCollection(collectionName: string, query: string, ctx: AgentRunContext) {
    const collection = await this.prisma.collection.findFirst({
      where: { userId: ctx.userId, name: { contains: collectionName, mode: 'insensitive' } },
    });
    if (!collection) {
      const available = await this.prisma.collection.findMany({
        where: { userId: ctx.userId },
        select: { name: true },
      });
      return {
        error: `No collection named "${collectionName}".`,
        availableCollections: available.map((c) => c.name),
      };
    }
    const matches = await this.vectorSearch.search(ctx.userId, query, {
      collectionId: collection.id,
    });
    return { collection: collection.name, ...this.toPassages(matches, ctx) };
  }

  private async getDocument(documentName: string, ctx: AgentRunContext) {
    const document = await this.prisma.document.findFirst({
      where: { userId: ctx.userId, name: { contains: documentName, mode: 'insensitive' } },
      include: {
        collection: { select: { name: true } },
        _count: { select: { chunks: true } },
        chunks: { orderBy: { chunkIndex: 'asc' }, take: 2 },
      },
    });
    if (!document) return { error: `No document matching "${documentName}".` };

    const opening = document.chunks.map((chunk) => ({
      ...chunk,
      documentName: document.name,
      collectionId: document.collectionId,
      similarity: 1,
    }));
    return {
      name: document.name,
      fileName: document.originalFileName,
      status: document.status,
      pages: document.pageCount,
      collection: document.collection?.name ?? null,
      chunks: document._count.chunks,
      uploadedAt: document.createdAt.toISOString(),
      ...this.toPassages(opening, ctx),
    };
  }

  /** Number each chunk once per run so the model's [n] citations map back to sources. */
  private toPassages(matches: ChunkMatch[], ctx: AgentRunContext) {
    if (!matches.length) return { passages: [], note: 'No relevant passages found.' };
    const passages = matches.map((match) => {
      let source = ctx.sources.find(
        (s) => s.documentId === match.documentId && s.chunkIndex === match.chunkIndex,
      );
      if (!source) {
        source = toCitation(match, ctx.sources.length + 1);
        ctx.sources.push(source);
      }
      return {
        number: source.index,
        document: match.documentName,
        page: match.pageNumber,
        text: match.content,
      };
    });
    return { passages };
  }
}
