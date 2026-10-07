import { Module } from '@nestjs/common';
import { VectorSearchModule } from '../vector-search/vector-search.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [VectorSearchModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
