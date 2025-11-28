import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './controllers';
import { AuthService } from './services';
import { JwtStrategy } from '@common/strategies';
import { PrismaService } from '@prisma';
import { EmailModule } from '@email';

@Module({
  imports: [
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('jwt.expiresIn') || '1d';
        return {
          secret: configService.get<string>('jwt.secret') || 'secret',
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
