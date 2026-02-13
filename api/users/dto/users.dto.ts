import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty() id: number;
    @ApiProperty() username: string;
    @ApiProperty() email: string;
    @ApiProperty({ required: false }) tokens?: number;
    @ApiProperty({ required: false }) subscription_status?: string;
    @ApiProperty({ required: false }) subscription_plan?: string;
}

export class ColaboradorDto {
    @ApiProperty() id: string;
    @ApiProperty({ required: false }) nome: string;
    @ApiProperty({ required: false }) email: string;
    @ApiProperty({ required: false }) cpf: string;
    @ApiProperty({ required: false }) cargo_id?: number;
    @ApiProperty({ required: false }) setor_id?: number;
    @ApiProperty({ required: false }) unidade_id?: number;
}
