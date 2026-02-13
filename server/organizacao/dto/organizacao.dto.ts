import { ApiProperty } from '@nestjs/swagger';

export class UnidadeDto {
    @ApiProperty() id: number;
    @ApiProperty() nome: string;
    @ApiProperty({ required: false }) empresa_mae?: string;
}

export class SetorDto {
    @ApiProperty() id: number;
    @ApiProperty() nome: string;
}

export class CargoDto {
    @ApiProperty() id: number;
    @ApiProperty() nome: string;
    @ApiProperty({ required: false }) setor_id?: number;
}

export class CargoSetorDto {
    @ApiProperty() id: number;
    @ApiProperty() idcargo: number;
    @ApiProperty() idsetor: number;
}
