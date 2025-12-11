import { Module } from '@nestjs/common';
import { QrController } from './controllers';
import { QrService } from './services';

@Module({
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}


