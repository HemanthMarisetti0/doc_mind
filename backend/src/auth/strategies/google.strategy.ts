import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleProfile } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      // Placeholders keep the app bootable when Google login is not configured;
      // GoogleAuthGuard rejects requests in that case.
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleProfile {
    return {
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName || profile.emails?.[0]?.value || 'DocMind user',
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
