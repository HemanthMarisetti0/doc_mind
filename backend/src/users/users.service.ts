import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toPublic(user: User): PublicUser {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  create(data: {
    email: string;
    name: string;
    passwordHash?: string;
    avatarUrl?: string;
    provider?: AuthProvider;
  }) {
    return this.prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return this.toPublic(user);
  }

  async getStats(userId: string) {
    const [documents, collections, conversations, readyDocuments, chunks] = await Promise.all([
      this.prisma.document.count({ where: { userId } }),
      this.prisma.collection.count({ where: { userId } }),
      this.prisma.conversation.count({ where: { userId } }),
      this.prisma.document.count({ where: { userId, status: 'READY' } }),
      this.prisma.documentChunk.count({ where: { document: { userId } } }),
    ]);
    return { documents, collections, conversations, readyDocuments, chunks };
  }
}
