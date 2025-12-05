import { Module } from '@nestjs/common';
import { VoucherController } from './controllers';
import { ClientService, PdfService, PreorderService } from './services';

@Module({
  controllers: [VoucherController],
  providers: [ClientService, PdfService, PreorderService],
  exports: [ClientService, PreorderService, PdfService],
})
export class VoucherModule {}

