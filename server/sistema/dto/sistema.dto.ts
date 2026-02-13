import { ApiProperty } from '@nestjs/swagger';

export class WebhookLogDto {
    @ApiProperty() id: number;
    @ApiProperty({ required: false }) status?: string;
    @ApiProperty({ required: false }) message?: string;
    @ApiProperty({ required: false }) created_at?: string;
}
