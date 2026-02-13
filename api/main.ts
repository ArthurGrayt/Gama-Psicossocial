import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: any;

async function bootstrap() {
    if (!cachedApp) {
        const app = await NestFactory.create(AppModule);

        app.enableCors();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));

        const config = new DocumentBuilder()
            .setTitle('Gama Psicossocial API')
            .setDescription('API para gerenciar dados do Gama Psicossocial')
            .setVersion('1.0')
            .addTag('Empresas')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        await app.init();
        cachedApp = app.getHttpAdapter().getInstance();
    }
    return cachedApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const appInstance = await bootstrap();
    return appInstance(req, res);
}
