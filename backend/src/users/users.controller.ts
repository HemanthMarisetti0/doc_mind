import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.update(user.id, dto);
  }

  @Get('me/stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.users.getStats(user.id);
  }
}
