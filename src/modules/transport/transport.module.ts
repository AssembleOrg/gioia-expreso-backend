import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';
import { TransportController } from './controllers';
import { TransportService } from './services';

@Module({
  imports: [PrismaModule],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}


