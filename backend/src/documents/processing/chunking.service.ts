import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractedPage } from './extractors/extracted-text';

export interface TextChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
}

/**
 * Sliding-window chunker that approximates tokens with words.
 * Each chunk remembers the page its first word came from, for citations.
 */
@Injectable()
export class ChunkingService {
  private readonly chunkSize: number;
  private readonly overlap: number;

  constructor(config: ConfigService) {
    this.chunkSize = Number(config.get('CHUNK_SIZE', 800));
    this.overlap = Math.min(Number(config.get('CHUNK_OVERLAP', 120)), this.chunkSize - 1);
  }

  chunk(pages: ExtractedPage[], chunkSize = this.chunkSize, overlap = this.overlap): TextChunk[] {
    const words = pages.flatMap((page) =>
      page.text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, pageNumber: page.pageNumber })),
    );

    const chunks: TextChunk[] = [];
    const step = chunkSize - overlap;
    for (let start = 0; start < words.length; start += step) {
      const window = words.slice(start, start + chunkSize);
      chunks.push({
        content: window.map((w) => w.word).join(' '),
        chunkIndex: chunks.length,
        pageNumber: window[0].pageNumber,
      });
      if (start + chunkSize >= words.length) break;
    }
    return chunks;
  }
}
