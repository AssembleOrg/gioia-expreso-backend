import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';
import { RecipientsController } from './controllers';
import { RecipientsService } from './services';

@Module({
  imports: [PrismaModule],
  controllers: [RecipientsController],
  providers: [RecipientsService],
  exports: [RecipientsService],
})
export class RecipientsModule {}
