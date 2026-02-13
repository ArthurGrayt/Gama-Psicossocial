import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { SistemaService } from './sistema.service';
import { WebhookLogDto } from './dto/sistema.dto';

@ApiTags('Sistema')
@Controller()
export class SistemaController {
    constructor(private readonly service: SistemaService) { }

    @Get('webhook-logs')
    @ApiResponse({ status: 200, type: [WebhookLogDto] })
    async getWebhookLogs() {
        return this.service.findAllWebhookLogs();
    }
}
