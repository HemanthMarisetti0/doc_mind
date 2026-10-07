import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from './dto/search.dto';
import { VectorSearchService } from './vector-search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class VectorSearchController {
  constructor(private readonly vectorSearch: VectorSearchService) {}

  /** Raw semantic search, without an LLM answer. */
  @Post()
  @HttpCode(200)
  search(@CurrentUser() user: AuthUser, @Body() dto: SearchDto) {
    return this.vectorSearch.search(
      user.id,
      dto.query,
      { collectionId: dto.collectionId, documentId: dto.documentId },
      dto.topK,
    );
  }
}
