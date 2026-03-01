import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { HealthController } from './health/health.controller';
import { EventModule } from './event/event.module';
import { RegistrationModule } from './registration/registration.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, EventModule, RegistrationModule, PrismaModule],
  controllers: [AppController, HealthController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
