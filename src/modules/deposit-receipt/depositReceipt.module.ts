import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';
import { DepositReceiptController } from './controllers';
import { DepositReceiptService } from './services';

@Module({
    imports: [PrismaModule],
    controllers: [DepositReceiptController],
    providers: [DepositReceiptService],
    exports: [DepositReceiptService],
})
export class DepositReceiptModule { }
