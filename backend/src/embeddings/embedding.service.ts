import { Injectable } from '@nestjs/common';
import { GeminiService } from '../common/gemini/gemini.service';

type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

const BATCH_SIZE = 50;

@Injectable()
export class EmbeddingService {
  constructor(private readonly gemini: GeminiService) {}

  /** Embed a user question for similarity search. */
  async generateEmbedding(text: string, taskType: EmbeddingTask = 'RETRIEVAL_QUERY') {
    const [embedding] = await this.embed([text], taskType);
    return embedding;
  }

  /** Embed document chunks in batches to stay within API request limits. */
  async generateEmbeddings(texts: string[]) {
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      results.push(...(await this.embed(texts.slice(i, i + BATCH_SIZE), 'RETRIEVAL_DOCUMENT')));
    }
    return results;
  }

  /** pgvector accepts vectors as a '[1,2,3]' literal. */
  toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(',')}]`;
  }

  private async embed(texts: string[], taskType: EmbeddingTask) {
    const response = await this.gemini.client.models.embedContent({
      model: this.gemini.embeddingModel,
      contents: texts,
      config: { taskType, outputDimensionality: this.gemini.embeddingDimensions },
    });
    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== texts.length) {
      throw new Error(`Expected ${texts.length} embeddings, received ${embeddings.length}`);
    }
    // Truncated (non-default size) Gemini embeddings are not unit length, so normalise them.
    return embeddings.map((e) => normalize(e.values ?? []));
  }
}

function normalize(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}
