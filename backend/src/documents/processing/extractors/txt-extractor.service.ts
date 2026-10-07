import { Injectable } from '@nestjs/common';
import { ExtractedPage, TextExtractor } from './extracted-text';

@Injectable()
export class TxtExtractorService implements TextExtractor {
  async extract(buffer: Buffer): Promise<ExtractedPage[]> {
    return [{ pageNumber: null, text: buffer.toString('utf-8') }];
  }
}
