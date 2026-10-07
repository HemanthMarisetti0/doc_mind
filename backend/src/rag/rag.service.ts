import { Injectable } from '@nestjs/common';
import { GeminiService } from '../common/gemini/gemini.service';
import { citedIndexes, SourceCitation } from '../common/sources';
import { ChunkMatch, SearchScope, VectorSearchService } from '../vector-search/vector-search.service';
import { RAG_SYSTEM_PROMPT } from './prompts';

export interface RagAnswer {
  answer: string;
  sources: SourceCitation[];
}

/**
 * Classic single-shot RAG: embed the question, retrieve chunks, ask Gemini with that context.
 * The conversational agent builds on the same pieces but lets the model choose its searches.
 */
@Injectable()
export class RagService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

  async query(userId: string, question: string, scope: SearchScope = {}): Promise<RagAnswer> {
    const chunks = await this.vectorSearch.search(userId, question, scope);
    if (!chunks.length) {
      return {
        answer: "I couldn't find anything relevant in your documents for that question.",
        sources: [],
      };
    }

    const sources = chunks.map((chunk, i) => toCitation(chunk, i + 1));
    const response = await this.gemini.client.models.generateContent({
      model: this.gemini.chatModel,
      contents: `Context:\n\n${formatContext(sources, chunks)}\n\nQuestion: ${question}`,
      config: { systemInstruction: RAG_SYSTEM_PROMPT, temperature: 0.2 },
    });

    const answer = response.text?.trim() || "I couldn't generate an answer. Please try again.";
    return { answer, sources: filterCited(answer, sources) };
  }
}

export function toCitation(chunk: ChunkMatch, index: number): SourceCitation {
  return {
    index,
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
    snippet: chunk.content.slice(0, 280),
    similarity: Math.round(chunk.similarity * 1000) / 1000,
  };
}

/** Render retrieved chunks as numbered passages the model can cite. */
export function formatContext(sources: SourceCitation[], chunks: ChunkMatch[]) {
  return sources
    .map((source, i) => {
      const page = source.pageNumber ? `, page ${source.pageNumber}` : '';
      return `[${source.index}] ${source.documentName}${page}\n${chunks[i].content}`;
    })
    .join('\n\n---\n\n');
}

export function filterCited(answer: string, sources: SourceCitation[]) {
  const used = citedIndexes(answer);
  return sources.filter((source) => used.has(source.index));
}
