import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmbeddingService } from '../../embeddings/embedding.service';
import { StorageService } from '../../storage/storage.service';
import { ChunkingService } from './chunking.service';
import { TextExtractionService } from './text-extraction.service';

/**
 * The ingestion pipeline: download → extract → chunk → embed → store.
 * Runs in-process after upload; the UI polls the document status.
 */
@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extraction: TextExtractionService,
    private readonly chunking: ChunkingService,
    private readonly embeddings: EmbeddingService,
  ) {}

  /** Fire-and-forget entry point; errors are recorded on the document, never thrown. */
  enqueue(documentId: string) {
    setImmediate(() => void this.process(documentId));
  }

  async process(documentId: string) {
    const started = Date.now();
    try {
      const document = await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING', errorMessage: null },
      });

      const buffer = await this.storage.download(document.storagePath);
      const pages = await this.extraction.extract(buffer, document.mimeType);
      const chunks = this.chunking.chunk(pages);
      const vectors = await this.embeddings.generateEmbeddings(chunks.map((c) => c.content));

      await this.prisma.$transaction(async (tx) => {
        await tx.documentChunk.deleteMany({ where: { documentId } });
        // Prisma cannot write the pgvector column, so insert rows with raw SQL.
        const rows = chunks.map(
          (chunk, i) => Prisma.sql`(
            ${randomUUID()}, ${documentId}, ${chunk.content}, ${chunk.chunkIndex},
            ${chunk.pageNumber}, ${this.embeddings.toVectorLiteral(vectors[i])}::vector
          )`,
        );
        for (let i = 0; i < rows.length; i += 100) {
          await tx.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "pageNumber", "embedding")
            VALUES ${Prisma.join(rows.slice(i, i + 100))}
          `;
        }
        await tx.document.update({
          where: { id: documentId },
          data: {
            status: 'READY',
            pageCount: Math.max(0, ...pages.map((p) => p.pageNumber ?? 0)) || null,
          },
        });
      }, { timeout: 60_000 });

      this.logger.log(
        `Processed ${document.name}: ${chunks.length} chunks in ${Date.now() - started}ms`,
      );
    } catch (err) {
      const message = (err as Error).message ?? 'Processing failed';
      this.logger.error(`Failed to process document ${documentId}: ${message}`);
      await this.prisma.document
        .update({
          where: { id: documentId },
          data: { status: 'FAILED', errorMessage: message.slice(0, 500) },
        })
        .catch(() => undefined); // the document may have been deleted mid-processing
    }
  }
}
