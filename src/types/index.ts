
export type QuestionType = 'short_text' | 'long_text' | 'choice' | 'select' | 'rating' | 'scale' | 'section_break';

export interface Form {
    id: number;
    created_at?: string;
    title: string;
    description: string;
    // Relationships/FKs
    unidade_id?: number;
    setor_id?: number;
    hse_id?: number;
    qtd_respostas?: number;
    colaboladores_inclusos?: string[];
    respondentes?: string[];
    link?: string;
    questions?: FormQuestion[];
}

export interface FormQuestion {
    id?: number;
    form_id?: number;
    temp_id?: string; // Frontend helper
    label: string;
    question_type: QuestionType;
    required: boolean;
    question_order: number;

    // Options for choice/select
    option_1?: string;
    option_2?: string;
    option_3?: string;
    option_4?: string;
    option_5?: number; // Numeric in schema

    // Rating
    min_value?: number;
    max_value?: number;

    // HSE Specific
    hse_dimension_id?: number;
    hse_question_number?: number;
    plano_acao_item?: string;
    titulo_relatorio?: string;
}

export interface FormAnswer {
    id: number;
    created_at: string;
    form_id: number;
    question_id: number;
    respondedor?: string | null; // User ID (UUID) from auth.users or collaborators table
    responder_identifier?: string | null; // Sometimes used for anonymous or external tracking
    responder_name?: string | null;
    answer_text?: string;
    answer_number?: number;

    // Context columns often present
    unidade_colaborador?: number;
    cargo?: number | string;
}

export interface Collaborator {
    id?: string; // Optional for insert
    nome: string;
    cpf: string;
    email?: string;
    data_nascimento?: string;
    sexo?: string;
    unidade?: number;
    unidade_id?: number;
    setor?: string;
    setor_id?: number;
    cargo?: string | number;
    cargo_id?: number;
    empresa_nome?: string; // Derived
    avulso?: boolean;
}

export interface HSEDimension {
    id: number;
    name: string;
    is_positive: boolean;
    risk_label?: string;
}

export interface HSERule {
    id: number;
    dimension_id: number;
    min_val: number;
    max_val: number;
    texto_personalizado: string;
}

export interface HSEDiagnosticItem {
    dimensao_id: number;
    dimensao: string;
    texto_pergunta: string;
    media: number;
    risco: string;
    cor: string;
    hse_question_number?: number;
}
