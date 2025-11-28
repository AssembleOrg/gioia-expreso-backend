import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@config';
import { PrismaModule } from '@prisma';
import { RabbitMQModule } from '@rabbitmq';
import { AuthModule } from '@modules/auth';
import { CalculatorModule } from '@modules/calculator';
import { JwtAuthGuard } from '@common/guards';

@Module({
  imports: [ConfigModule, PrismaModule, RabbitMQModule, AuthModule, CalculatorModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
