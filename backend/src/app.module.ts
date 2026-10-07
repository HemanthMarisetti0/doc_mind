import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentModule } from './agent/agent.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CollectionsModule } from './collections/collections.module';
import { validateEnv } from './common/env.validation';
import { GeminiModule } from './common/gemini/gemini.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DocumentsModule } from './documents/documents.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { RagModule } from './rag/rag.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { VectorSearchModule } from './vector-search/vector-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    GeminiModule,
    StorageModule,
    UsersModule,
    AuthModule,
    CollectionsModule,
    EmbeddingsModule,
    DocumentsModule,
    VectorSearchModule,
    RagModule,
    AgentModule,
    ConversationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
