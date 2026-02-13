import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!app) {
        app = await NestFactory.create(AppModule);

        app.enableCors();
        app.useGlobalPipes(new ValidationPipe());

        const config = new DocumentBuilder()
            .setTitle('Gama Psicossocial API')
            .setDescription('API para gerenciar dados do Gama Psicossocial')
            .setVersion('1.0')
            .addTag('Empresas')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);

        await app.init();
    }

    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
