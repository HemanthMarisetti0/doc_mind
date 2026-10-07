import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { ExtractedPage, TextExtractor } from './extracted-text';

@Injectable()
export class DocxExtractorService implements TextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedPage[]> {
    // DOCX has no fixed pagination, so the whole file is a single "page".
    const { value } = await mammoth.extractRawText({ buffer });
    return [{ pageNumber: null, text: value }];
  }
}
