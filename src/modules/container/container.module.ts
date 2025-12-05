import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';
import { ContainerController } from './controllers';
import { ContainerService } from './services';

@Module({
  imports: [PrismaModule],
  controllers: [ContainerController],
  providers: [ContainerService],
  exports: [ContainerService],
})
export class ContainerModule {}

