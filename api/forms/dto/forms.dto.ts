import { ApiProperty } from '@nestjs/swagger';

export class FormDto {
    @ApiProperty() id: number;
    @ApiProperty({ required: false }) title?: string;
    @ApiProperty({ required: false }) description?: string;
    @ApiProperty({ required: false }) link?: string;
    @ApiProperty({ required: false }) unidade_id?: number;
    @ApiProperty({ required: false }) setor_id?: number;
}

export class FormQuestionDto {
    @ApiProperty() id: number;
    @ApiProperty() label: string;
    @ApiProperty({ required: false }) question_type?: string;
    @ApiProperty({ required: false }) question_order?: number;
    @ApiProperty({ required: false }) hse_dimension_id?: number;
}

export class FormAnswerDto {
    @ApiProperty() id: number;
    @ApiProperty({ required: false }) form_id?: number;
    @ApiProperty({ required: false }) question_id?: number;
    @ApiProperty({ required: false }) respondedor?: string;
    @ApiProperty({ required: false }) answer_text?: string;
    @ApiProperty({ required: false }) answer_number?: number;
}

export class FormHseDimensionDto {
    @ApiProperty() id: number;
    @ApiProperty() name: string;
    @ApiProperty({ required: false }) description?: string;
    @ApiProperty({ required: false }) is_positive?: boolean;
}

export class FormHseRuleDto {
    @ApiProperty() id: number;
    @ApiProperty({ required: false }) dimension_id?: number;
    @ApiProperty({ required: false }) min_val?: number;
    @ApiProperty({ required: false }) max_val?: number;
    @ApiProperty({ required: false }) risk_label?: string;
}
