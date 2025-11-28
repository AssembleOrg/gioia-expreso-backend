import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from '@common/interceptors';
import { HttpExceptionFilter } from '@common/filters';
import { EnvConfig } from '@config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService<EnvConfig>>(ConfigService);

  // Servir archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger configuration
  const swaggerEnabled = configService.get('swagger.enabled', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });

  if (swaggerEnabled || nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Gioia Expreso API')
      .setDescription('API para servicios de Courier/Logística')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Production password protection
    if (nodeEnv === 'production') {
      const swaggerPassword = configService.get('swagger.password', { infer: true });
      
      // Middleware para proteger todas las rutas de Swagger
      app.use('/api/docs', (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
          return res.status(401).send('Authentication required');
        }

        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        if (username !== 'admin' || password !== swaggerPassword) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
          return res.status(401).send('Invalid credentials');
        }
        next();
      });
    }

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
  if (swaggerEnabled || nodeEnv === 'development') {
    console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
