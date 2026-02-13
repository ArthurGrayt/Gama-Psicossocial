import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto, ColaboradorDto } from './dto/users.dto';

@ApiTags('Usuários e Colaboradores')
@Controller()
export class UsersController {
    constructor(private readonly service: UsersService) { }

    @Get('users')
    @ApiResponse({ status: 200, type: [UserDto] })
    async getUsers() {
        return this.service.findAllUsers();
    }

    @Get('colaboradores')
    @ApiResponse({ status: 200, type: [ColaboradorDto] })
    async getColaboradores() {
        return this.service.findAllColaboradores();
    }
}
