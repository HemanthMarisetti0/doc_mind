import { Content, FunctionCallingConfigMode } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../common/gemini/gemini.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SourceCitation } from '../common/sources';
import { AGENT_SYSTEM_PROMPT } from '../rag/prompts';
import { filterCited } from '../rag/rag.service';
import { SearchScope } from '../vector-search/vector-search.service';
import { AGENT_TOOLS, AgentRunContext, AgentToolsService } from './agent-tools.service';

const MAX_STEPS = 5;

export interface AgentHistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

export interface AgentResult {
  answer: string;
  sources: SourceCitation[];
  toolCalls: { name: string; args: Record<string, unknown> }[];
}

/**
 * A small tool-using agent: Gemini decides whether to search, which tool to use and
 * with what query, then answers from the passages it retrieved.
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly tools: AgentToolsService,
  ) {}

  async run(
    userId: string,
    question: string,
    history: AgentHistoryMessage[],
    scope: SearchScope,
  ): Promise<AgentResult> {
    const ctx: AgentRunContext = { userId, scope, sources: [] };
    const toolCalls: AgentResult['toolCalls'] = [];
    const systemInstruction = `${AGENT_SYSTEM_PROMPT}\n\n${await this.describeScope(userId, scope)}`;

    const contents: Content[] = [
      ...history.map((m) => ({
        role: m.role === 'USER' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    for (let step = 0; step < MAX_STEPS; step++) {
      const lastStep = step === MAX_STEPS - 1;
      const response = await this.gemini.client.models.generateContent({
        model: this.gemini.chatModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
          tools: [{ functionDeclarations: AGENT_TOOLS }],
          // On the last step, force a final text answer.
          toolConfig: lastStep
            ? { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } }
            : undefined,
        },
      });

      const calls = response.functionCalls ?? [];
      if (!calls.length) {
        const answer = response.text?.trim() || "I couldn't generate an answer. Please try again.";
        return { answer, sources: filterCited(answer, ctx.sources), toolCalls };
      }

      // Keep the model turn verbatim (it may carry thought signatures the API requires back).
      const modelTurn = response.candidates?.[0]?.content;
      if (modelTurn) contents.push(modelTurn);

      const results = await Promise.all(
        calls.map(async (call) => {
          const name = call.name ?? '';
          const args = call.args ?? {};
          toolCalls.push({ name, args });
          this.logger.debug(`Tool call ${name} ${JSON.stringify(args)}`);
          const result = await this.tools
            .execute(name, args, ctx)
            .catch((err: Error) => ({ error: err.message }));
          return { functionResponse: { id: call.id, name, response: { result } } };
        }),
      );
      contents.push({ role: 'user', parts: results });
    }

    return {
      answer: "I couldn't complete that request. Please try rephrasing your question.",
      sources: [],
      toolCalls,
    };
  }

  /** Tell the model what the conversation is about and what collections exist. */
  private async describeScope(userId: string, scope: SearchScope) {
    const [collections, document, collection] = await Promise.all([
      this.prisma.collection.findMany({ where: { userId }, select: { name: true }, take: 50 }),
      scope.documentId
        ? this.prisma.document.findFirst({ where: { id: scope.documentId, userId } })
        : null,
      scope.collectionId
        ? this.prisma.collection.findFirst({ where: { id: scope.collectionId, userId } })
        : null,
    ]);

    const lines = [];
    if (document) lines.push(`This conversation is about the document "${document.name}".`);
    else if (collection) lines.push(`This conversation is about the collection "${collection.name}".`);
    else lines.push("This conversation covers all of the user's documents.");
    lines.push(
      collections.length
        ? `The user's collections: ${collections.map((c) => c.name).join(', ')}.`
        : 'The user has no collections yet.',
    );
    return lines.join('\n');
  }
}
