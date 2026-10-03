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
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { DepositReceiptModule } from '@modules/deposit-receipt';
import { RumboModule } from '@modules/rumbo';

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
    DepositReceiptModule,
    RumboModule,
  ],
  controllers: [],
  // El orden importa: primero se autentica (JwtAuthGuard carga req.user)
  // y después se chequean los @Roles (RolesGuard).
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
