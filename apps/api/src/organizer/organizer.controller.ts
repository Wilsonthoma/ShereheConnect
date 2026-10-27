import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { SubmitProfileDto } from './dto/submit-profile.dto';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class OrganizerController {
  constructor(private readonly organizer: OrganizerService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.organizer.getOwnProfile(user.id);
  }

  @Post('profile/submit')
  submitProfile(@CurrentUser() user: any, @Body() dto: SubmitProfileDto) {
    return this.organizer.submitProfile(user.id, dto);
  }

  @Get('payment-methods')
  listMethods(@CurrentUser() user: any) {
    return this.organizer.listOwnPaymentMethods(user.id);
  }

  @Post('payment-methods')
  addMethod(@CurrentUser() user: any, @Body() dto: AddPaymentMethodDto) {
    return this.organizer.addPaymentMethod(user.id, dto);
  }

  @Delete('payment-methods/:id')
  deleteMethod(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.organizer.deletePaymentMethod(user.id, id);
  }
}
