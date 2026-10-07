import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmbeddingService } from '../embeddings/embedding.service';

/** Optional narrowing of a search. Every search is always limited to one user. */
export interface SearchScope {
  collectionId?: string | null;
  documentId?: string | null;
}

export interface ChunkMatch {
  id: string;
  documentId: string;
  documentName: string;
  collectionId: string | null;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  similarity: number;
}

@Injectable()
export class VectorSearchService {
  private readonly defaultTopK: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
    config: ConfigService,
  ) {
    this.defaultTopK = Number(config.get('SEARCH_TOP_K', 6));
  }

  async search(userId: string, query: string, scope: SearchScope = {}, topK = this.defaultTopK) {
    const embedding = await this.embeddings.generateEmbedding(query);
    return this.searchByEmbedding(userId, embedding, scope, topK);
  }

  /** Cosine similarity search over the user's READY documents using pgvector's <=> operator. */
  async searchByEmbedding(
    userId: string,
    embedding: number[],
    scope: SearchScope = {},
    topK = this.defaultTopK,
  ): Promise<ChunkMatch[]> {
    const vector = this.embeddings.toVectorLiteral(embedding);
    const filters = [
      Prisma.sql`d."userId" = ${userId}`,
      Prisma.sql`d."status" = 'READY'`,
      Prisma.sql`c."embedding" IS NOT NULL`,
    ];
    if (scope.collectionId) filters.push(Prisma.sql`d."collectionId" = ${scope.collectionId}`);
    if (scope.documentId) filters.push(Prisma.sql`d."id" = ${scope.documentId}`);

    const rows = await this.prisma.$queryRaw<ChunkMatch[]>`
      SELECT c."id", c."documentId", d."name" AS "documentName", d."collectionId",
             c."content", c."chunkIndex", c."pageNumber",
             1 - (c."embedding" <=> ${vector}::vector) AS "similarity"
      FROM "DocumentChunk" c
      JOIN "Document" d ON d."id" = c."documentId"
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY c."embedding" <=> ${vector}::vector
      LIMIT ${Math.min(Math.max(topK, 1), 20)}
    `;
    return rows.map((row) => ({ ...row, similarity: Number(row.similarity) }));
  }
}
