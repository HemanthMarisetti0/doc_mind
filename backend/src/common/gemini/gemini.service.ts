import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Thin holder for the Gemini client so the API key stays server-side in one place. */
@Injectable()
export class GeminiService {
  readonly client: GoogleGenAI;
  readonly chatModel: string;
  readonly embeddingModel: string;
  readonly embeddingDimensions: number;

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
      // Retry transient 408/429/5xx (e.g. 503 "high demand") with short exponential backoff.
      httpOptions: { retryOptions: { attempts: 4, initialDelay: 1, maxDelay: 8 } },
    });
    this.chatModel = config.get<string>('GEMINI_CHAT_MODEL', 'gemini-flash-latest');
    this.embeddingModel = config.get<string>('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001');
    this.embeddingDimensions = Number(config.get('EMBEDDING_DIMENSIONS', 768));
  }
}
