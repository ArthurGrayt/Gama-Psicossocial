import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { FormDto, FormQuestionDto, FormAnswerDto, FormHseDimensionDto, FormHseRuleDto } from './dto/forms.dto';

@ApiTags('Formulários e HSE')
@Controller()
export class FormsController {
    constructor(private readonly service: FormsService) { }

    @Get('forms')
    @ApiResponse({ status: 200, type: [FormDto] })
    async getForms() {
        return this.service.findAllForms();
    }

    @Get('form-questions')
    @ApiResponse({ status: 200, type: [FormQuestionDto] })
    async getQuestions() {
        return this.service.findAllQuestions();
    }

    @Get('form-answers')
    @ApiResponse({ status: 200, type: [FormAnswerDto] })
    async getAnswers() {
        return this.service.findAllAnswers();
    }

    @Get('form-hse-dimensions')
    @ApiResponse({ status: 200, type: [FormHseDimensionDto] })
    async getDimensions() {
        return this.service.findAllDimensions();
    }

    @Get('form-hse-rules')
    @ApiResponse({ status: 200, type: [FormHseRuleDto] })
    async getRules() {
        return this.service.findAllRules();
    }
}
