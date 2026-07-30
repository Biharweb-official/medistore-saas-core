import { Controller, Get, Post, Body, Query, UseGuards, Req, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationConfigDto } from './dto/notification-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notifications Management')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get notification history logs with secure pagination clamping' })
  async getLogs(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const safePage = Math.max(1, Math.min(page, 1000));
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.notificationsService.getLogs(req.user.tenantId, safePage, safeLimit);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get tenant notification gateway configuration' })
  async getConfig(@Req() req: any) {
    return this.notificationsService.getConfig(req.user.tenantId);
  }

  @Post('config')
  @ApiOperation({ summary: 'Update tenant notification gateway settings' })
  async updateConfig(@Req() req: any, @Body() dto: NotificationConfigDto) {
    return this.notificationsService.updateConfig(req.user.tenantId, dto);
  }
}
