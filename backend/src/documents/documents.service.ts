import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ListDocumentsDto } from './dto/list-documents.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentProcessorService } from './processing/document-processor.service';
import { SUPPORTED_FILE_TYPES } from './processing/text-extraction.service';

const MIME_BY_EXTENSION = Object.fromEntries(
  Object.entries(SUPPORTED_FILE_TYPES).map(([mime, ext]) => [ext, mime]),
);
// Browsers sometimes send a generic type for .txt/.docx; we trust the extension then.
const GENERIC_MIME_TYPES = ['', 'application/octet-stream'];

@Injectable()
export class DocumentsService {
  private readonly maxFileSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly processor: DocumentProcessorService,
    config: ConfigService,
  ) {
    this.maxFileSize = Number(config.get('MAX_FILE_SIZE_MB', 15)) * 1024 * 1024;
  }

  async upload(userId: string, file: Express.Multer.File | undefined, dto: UploadDocumentDto) {
    if (!file) throw new BadRequestException('A file is required');
    const mimeType = this.validateFile(file);
    if (dto.collectionId) await this.assertCollectionOwner(userId, dto.collectionId);

    const id = randomUUID();
    const safeName = file.originalname.replace(/[^\w.\-]+/g, '_');
    const storagePath = `${userId}/${id}/${safeName}`;
    await this.storage.upload(storagePath, file.buffer, mimeType);

    const document = await this.prisma.document.create({
      data: {
        id,
        name: dto.name?.trim() || file.originalname.replace(/\.[^.]+$/, ''),
        originalFileName: file.originalname,
        mimeType,
        fileSize: file.size,
        storagePath,
        userId,
        collectionId: dto.collectionId,
      },
      include: { collection: { select: { id: true, name: true } } },
    });

    this.processor.enqueue(document.id);
    return document;
  }

  list(userId: string, query: ListDocumentsDto) {
    return this.prisma.document.findMany({
      where: {
        userId,
        collectionId: query.collectionId,
        status: query.status,
        name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
      },
      include: {
        collection: { select: { id: true, name: true } },
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, userId },
      include: {
        collection: { select: { id: true, name: true } },
        _count: { select: { chunks: true } },
        chunks: {
          select: { id: true, chunkIndex: true, pageNumber: true, content: true },
          orderBy: { chunkIndex: 'asc' },
          take: 20,
        },
      },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    await this.assertOwner(userId, id);
    if (dto.collectionId) await this.assertCollectionOwner(userId, dto.collectionId);
    return this.prisma.document.update({
      where: { id },
      data: { name: dto.name, collectionId: dto.collectionId },
      include: { collection: { select: { id: true, name: true } } },
    });
  }

  async remove(userId: string, id: string) {
    const document = await this.assertOwner(userId, id);
    await this.prisma.document.delete({ where: { id } });
    await this.storage.remove(document.storagePath);
    return { id };
  }

  async reprocess(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const document = await this.prisma.document.update({
      where: { id },
      data: { status: 'UPLOADED', errorMessage: null },
    });
    this.processor.enqueue(id);
    return document;
  }

  async downloadUrl(userId: string, id: string) {
    const document = await this.assertOwner(userId, id);
    return { url: await this.storage.createSignedUrl(document.storagePath) };
  }

  private async assertOwner(userId: string, id: string) {
    const document = await this.prisma.document.findFirst({ where: { id, userId } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  private async assertCollectionOwner(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
  }

  /** Returns the canonical mime type, or throws for unsupported/oversized files. */
  private validateFile(file: Express.Multer.File) {
    if (file.size === 0) throw new BadRequestException('The file is empty');
    if (file.size > this.maxFileSize) {
      throw new PayloadTooLargeException(
        `Files must be smaller than ${this.maxFileSize / 1024 / 1024} MB`,
      );
    }
    const extension = extname(file.originalname).toLowerCase();
    const expectedMime = MIME_BY_EXTENSION[extension];
    const mimeMatches =
      file.mimetype === expectedMime || GENERIC_MIME_TYPES.includes(file.mimetype);
    if (!expectedMime || !mimeMatches) {
      throw new BadRequestException('Only PDF, DOCX and TXT files are supported');
    }
    return expectedMime;
  }
}
