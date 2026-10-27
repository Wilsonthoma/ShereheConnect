import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get('organizers/kyc')
  listOrganizersKyc() {
    return this.usersService.listOrganizersKyc();
  }

  @Get('online')
  listOnlineUsers() {
    return this.usersService.listOnlineUsers();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    return this.usersService.updateStatus(id, dto, req.user.id);
  }

  @Patch(':id/verify-email')
  verifyEmail(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.verifyEmail(id);
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return this.usersService.softDelete(id, req.user.id);
  }

  @Delete(':id/sessions')
  revokeSessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.revokeSessions(id);
  }

  @Patch('organizers/:id/kyc')
  reviewKyc(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKycDto,
    @Req() req: any,
  ) {
    return this.usersService.reviewKyc(id, dto, req.user.id);
  }
}
