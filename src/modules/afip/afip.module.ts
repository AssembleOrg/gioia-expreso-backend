import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AfipController } from './controllers';
import { AfipService } from './services';

@Module({
  imports: [HttpModule],
  controllers: [AfipController],
  providers: [AfipService],
  exports: [AfipService],
})
export class AfipModule {}

