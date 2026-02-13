import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { OrganizacaoService } from './organizacao.service';
import { UnidadeDto, SetorDto, CargoDto, CargoSetorDto } from './dto/organizacao.dto';

@ApiTags('Organização')
@Controller()
export class OrganizacaoController {
    constructor(private readonly service: OrganizacaoService) { }

    @Get('unidades')
    @ApiResponse({ status: 200, type: [UnidadeDto] })
    async getUnidades() {
        return this.service.findAllUnidades();
    }

    @Get('setores')
    @ApiResponse({ status: 200, type: [SetorDto] })
    async getSetores() {
        return this.service.findAllSetores();
    }

    @Get('cargos')
    @ApiResponse({ status: 200, type: [CargoDto] })
    async getCargos() {
        return this.service.findAllCargos();
    }

    @Get('cargo-setor')
    @ApiResponse({ status: 200, type: [CargoSetorDto] })
    async getCargoSetor() {
        return this.service.findAllCargoSetor();
    }
}
