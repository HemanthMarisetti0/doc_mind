import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService, GoogleProfile } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  /** Lets the frontend hide the Google button when OAuth is not configured. */
  @Get('providers')
  providers() {
    return {
      google: Boolean(
        this.config.get('GOOGLE_CLIENT_ID') && this.config.get('GOOGLE_CLIENT_SECRET'),
      ),
    };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  google() {
    // Passport redirects to Google.
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
    const profile = req.user as GoogleProfile;
    if (!profile?.email) {
      return res.redirect(`${frontend}/login?error=google`);
    }
    const { accessToken } = await this.auth.loginWithGoogle(profile);
    // The token travels in the URL fragment so it never reaches server logs.
    return res.redirect(`${frontend}/auth/callback#token=${encodeURIComponent(accessToken)}`);
  }
}
