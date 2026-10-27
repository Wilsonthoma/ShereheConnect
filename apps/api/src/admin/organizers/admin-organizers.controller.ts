import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminOrganizersService } from './admin-organizers.service';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/organizers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrganizersController {
  constructor(private readonly service: AdminOrganizersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOne(id);
  }

  @Patch(':id/kyc')
  reviewKyc(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewKycDto,
    @Req() req: any,
  ) {
    return this.service.reviewKyc(id, dto, req.user.id);
  }

  @Patch('payment-methods/:id/approve')
  approvePaymentMethod(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.approvePaymentMethod(id);
  }
}
