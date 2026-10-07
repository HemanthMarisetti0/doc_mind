import { BadGatewayException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AgentService } from '../agent/agent.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

const DEFAULT_TITLE = 'New conversation';
const HISTORY_LIMIT = 12;

const SCOPE_INCLUDE = {
  collection: { select: { id: true, name: true } },
  document: { select: { id: true, name: true } },
} satisfies Prisma.ConversationInclude;

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    if (dto.collectionId) {
      const owned = await this.prisma.collection.count({ where: { id: dto.collectionId, userId } });
      if (!owned) throw new NotFoundException('Collection not found');
    }
    if (dto.documentId) {
      const owned = await this.prisma.document.count({ where: { id: dto.documentId, userId } });
      if (!owned) throw new NotFoundException('Document not found');
    }
    return this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title ?? DEFAULT_TITLE,
        // A document scope is narrower than a collection scope, so it wins.
        documentId: dto.documentId,
        collectionId: dto.documentId ? undefined : dto.collectionId,
      },
      include: SCOPE_INCLUDE,
    });
  }

  list(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: { ...SCOPE_INCLUDE, _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      include: { ...SCOPE_INCLUDE, messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async update(userId: string, id: string, dto: UpdateConversationDto) {
    await this.assertOwner(userId, id);
    return this.prisma.conversation.update({
      where: { id },
      data: { title: dto.title },
      include: SCOPE_INCLUDE,
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
    return { id };
  }

  /** Ask the agent, then persist the question and answer together. */
  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.assertOwner(userId, conversationId);
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { role: true, content: true },
    });

    let result;
    try {
      result = await this.agent.run(userId, content, history.reverse(), {
        collectionId: conversation.collectionId,
        documentId: conversation.documentId,
      });
    } catch (err) {
      this.logger.error(`Agent failed: ${(err as Error).message}`);
      throw new BadGatewayException('The AI service is unavailable right now. Please try again.');
    }

    const [userMessage, assistantMessage] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, role: 'USER', content } }),
      this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: result.answer,
          sources: result.sources as unknown as Prisma.InputJsonValue,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title: conversation.title === DEFAULT_TITLE ? toTitle(content) : undefined,
          updatedAt: new Date(),
        },
      }),
    ]);

    return { userMessage, assistantMessage, toolCalls: result.toolCalls };
  }

  private async assertOwner(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}

function toTitle(question: string) {
  const clean = question.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean;
}
