import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@config';
import { PrismaModule } from '@prisma';
import { RabbitMQModule } from '@rabbitmq';
import { AuthModule } from '@modules/auth';
import { CalculatorModule } from '@modules/calculator';
import { VoucherModule } from '@modules/voucher';
import { QrModule } from '@modules/qr';
import { AfipModule } from '@modules/afip';
import { TransportModule } from '@modules/transport';
import { ContainerModule } from '@modules/container';
import { JwtAuthGuard } from '@common/guards';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RabbitMQModule,
    AuthModule,
    CalculatorModule,
    VoucherModule,
    QrModule,
    AfipModule,
    TransportModule,
    ContainerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
