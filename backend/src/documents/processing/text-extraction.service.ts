import { Injectable } from '@nestjs/common';
import { ExtractedPage, TextExtractor } from './extractors/extracted-text';
import { DocxExtractorService } from './extractors/docx-extractor.service';
import { PdfExtractorService } from './extractors/pdf-extractor.service';
import { TxtExtractorService } from './extractors/txt-extractor.service';

export const SUPPORTED_FILE_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

/** Picks the right extractor for a mime type and cleans up the result. */
@Injectable()
export class TextExtractionService {
  private readonly extractors: Record<string, TextExtractor>;

  constructor(pdf: PdfExtractorService, docx: DocxExtractorService, txt: TxtExtractorService) {
    this.extractors = {
      'application/pdf': pdf,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': docx,
      'text/plain': txt,
    };
  }

  async extract(buffer: Buffer, mimeType: string): Promise<ExtractedPage[]> {
    const extractor = this.extractors[mimeType];
    if (!extractor) throw new Error(`Unsupported file type: ${mimeType}`);

    const pages = (await extractor.extract(buffer))
      .map((page) => ({ ...page, text: clean(page.text) }))
      .filter((page) => page.text.length > 0);

    if (!pages.length) {
      throw new Error('No readable text found. Scanned/image-only files are not supported.');
    }
    return pages;
  }
}

function clean(text: string) {
  return text
    .replace(/\u0000/g, '') // Postgres rejects NUL bytes in text columns
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
