import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super({ session: false });
  }

  canActivate(context: ExecutionContext) {
    if (!this.config.get('GOOGLE_CLIENT_ID') || !this.config.get('GOOGLE_CLIENT_SECRET')) {
      throw new ServiceUnavailableException('Google login is not configured');
    }
    return super.canActivate(context);
  }
}
