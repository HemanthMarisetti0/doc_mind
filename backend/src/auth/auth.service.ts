import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface GoogleProfile {
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.users.findByEmail(dto.email)) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    return this.buildSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const valid = user?.passwordHash && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !valid) throw new UnauthorizedException('Invalid email or password');
    return this.buildSession(user);
  }

  /** Find or create the user behind a Google login. Existing email accounts are linked. */
  async loginWithGoogle(profile: GoogleProfile) {
    const existing = await this.users.findByEmail(profile.email);
    const user =
      existing ??
      (await this.users.create({
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        provider: 'GOOGLE',
      }));
    return this.buildSession(user);
  }

  async me(userId: string) {
    return this.users.toPublic(await this.users.findById(userId));
  }

  private buildSession(user: User) {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    return { accessToken, user: this.users.toPublic(user) };
  }
}
