import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('registrations')
@UseGuards(AuthGuard('jwt')) // All registration endpoints require authentication
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  async register(
    @CurrentUser() user,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    return this.registrationService.register(
      user.userId,
      createRegistrationDto,
    );
  }

  @Get('me')
  async getMyRegistrations(@CurrentUser() user) {
    return this.registrationService.findUserRegistrations(user.userId);
  }

  @Delete(':id')
  async cancel(@CurrentUser() user, @Param('id') id: string) {
    return this.registrationService.cancelRegistration(user.userId, id);
  }
}
