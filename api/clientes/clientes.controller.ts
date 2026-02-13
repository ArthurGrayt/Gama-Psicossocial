import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { ClienteDto } from './dto/cliente.dto';

@ApiTags('Empresas')
@Controller('empresas')
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Get()
    @ApiResponse({ status: 200, description: 'Lista de todas as empresas.', type: [ClienteDto] })
    async findAll(): Promise<ClienteDto[]> {
        return this.clientesService.findAll();
    }
}
