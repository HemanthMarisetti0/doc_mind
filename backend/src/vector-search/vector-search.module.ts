import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { VectorSearchController } from './vector-search.controller';
import { VectorSearchService } from './vector-search.service';

@Module({
  imports: [EmbeddingsModule],
  controllers: [VectorSearchController],
  providers: [VectorSearchService],
  exports: [VectorSearchService],
})
export class VectorSearchModule {}
