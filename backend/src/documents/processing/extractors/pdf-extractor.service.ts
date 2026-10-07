import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { ExtractedPage, TextExtractor } from './extracted-text';

@Injectable()
export class PdfExtractorService implements TextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedPage[]> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.pages.map((page) => ({ pageNumber: page.num, text: page.text }));
    } finally {
      await parser.destroy();
    }
  }
}
