import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({ data: { ...dto, userId } });
  }

  list(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { documents: true, conversations: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { chunks: true } } },
        },
        _count: { select: { documents: true, conversations: true } },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async update(userId: string, id: string, dto: UpdateCollectionDto) {
    await this.assertOwner(userId, id);
    return this.prisma.collection.update({ where: { id }, data: dto });
  }

  /** Documents inside are kept and simply become unassigned. */
  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.collection.delete({ where: { id } });
    return { id };
  }

  private async assertOwner(userId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({ where: { id, userId } });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }
}
