import { Module } from '@nestjs/common';
import { OrganizacaoController } from './organizacao.controller';
import { OrganizacaoService } from './organizacao.service';

@Module({
    controllers: [OrganizacaoController],
    providers: [OrganizacaoService],
})
export class OrganizacaoModule { }
