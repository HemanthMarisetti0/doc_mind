import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { RagQueryDto } from './dto/rag-query.dto';
import { RagService } from './rag.service';

@UseGuards(JwtAuthGuard)
@Controller('rag')
export class RagController {
  constructor(private readonly rag: RagService) {}

  /** Stateless question answering (no conversation history). */
  @Post('query')
  @HttpCode(200)
  query(@CurrentUser() user: AuthUser, @Body() dto: RagQueryDto) {
    return this.rag.query(user.id, dto.question, {
      collectionId: dto.collectionId,
      documentId: dto.documentId,
    });
  }
}
