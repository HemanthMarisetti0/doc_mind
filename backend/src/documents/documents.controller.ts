import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

// Hard ceiling for multer; the configurable limit is enforced in the service.
const UPLOAD_HARD_LIMIT = 50 * 1024 * 1024;

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: UPLOAD_HARD_LIMIT } }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documents.upload(user.id, file, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListDocumentsDto) {
    return this.documents.list(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.findOne(user.id, id);
  }

  @Get(':id/download')
  download(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.downloadUrl(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documents.update(user.id, id, dto);
  }

  @Post(':id/reprocess')
  reprocess(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.reprocess(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.remove(user.id, id);
  }
}
