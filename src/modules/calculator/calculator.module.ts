import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CalculatorController } from './controllers';
import { CalculatorService, CalculatorAuthService } from './services';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [CalculatorController],
  providers: [CalculatorService, CalculatorAuthService],
  exports: [CalculatorService],
})
export class CalculatorModule {}

