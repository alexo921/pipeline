import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Pipeline')
    .setDescription('Pipleline')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Enable cookie parsing
  app.use(cookieParser());

  // Enable CORS only in development (production uses Nginx CORS)
  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: ['http://localhost:3005', 'http://localhost:3000', 'http://localhost:3002'],
      credentials: true,
    });
  }

  // Set up global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
