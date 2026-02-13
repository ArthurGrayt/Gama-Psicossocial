import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { FinanceiroService } from './financeiro.service';
import { PaymentHistoryDto } from './dto/financeiro.dto';

@ApiTags('Financeiro')
@Controller()
export class FinanceiroController {
    constructor(private readonly service: FinanceiroService) { }

    @Get('payment-history')
    @ApiResponse({ status: 200, type: [PaymentHistoryDto] })
    async getPaymentHistory() {
        return this.service.findAllPayments();
    }
}
