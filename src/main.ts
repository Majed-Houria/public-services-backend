import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const details = {};
        errors.forEach((err) => {
          if (err.constraints) {
            details[err.property] = Object.values(err.constraints)[0];
          }
        });
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          details,
        });
      },
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
