import { ApiProperty } from '@nestjs/swagger';

export class PaymentHistoryDto {
    @ApiProperty() id: number;
    @ApiProperty() user_id: number;
    @ApiProperty() email: string;
    @ApiProperty() amount_paid: number;
    @ApiProperty() status: string;
    @ApiProperty({ required: false }) plan_type?: string;
}
