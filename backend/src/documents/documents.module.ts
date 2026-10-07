import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ChunkingService } from './processing/chunking.service';
import { DocumentProcessorService } from './processing/document-processor.service';
import { DocxExtractorService } from './processing/extractors/docx-extractor.service';
import { PdfExtractorService } from './processing/extractors/pdf-extractor.service';
import { TxtExtractorService } from './processing/extractors/txt-extractor.service';
import { TextExtractionService } from './processing/text-extraction.service';

@Module({
  imports: [EmbeddingsModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentProcessorService,
    TextExtractionService,
    PdfExtractorService,
    DocxExtractorService,
    TxtExtractorService,
    ChunkingService,
  ],
})
export class DocumentsModule {}
